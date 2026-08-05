/**
 * Statistics Controller
 * Enhanced analytics: workload, subject distribution, audit logs
 */
const { pool } = require('../config/database');
const { sendSuccess } = require('../utils/response');

// ─── Teacher workload statistics ──────────────────────────────────────────────
const getTeacherWorkload = async (req, res, next) => {
  try {
    const { academic_year_id } = req.query;
    const ayClause = academic_year_id ? 'AND t.academic_year_id=?' : '';
    const params   = academic_year_id ? [academic_year_id] : [];

    const [rows] = await pool.execute(
      `SELECT s.id, s.name, s.staff_id as code, s.max_hours_per_week,
        d.name as dept_name, d.code as dept_code,
        COUNT(t.id) as total_periods,
        COUNT(DISTINCT t.day_of_week) as active_days,
        COUNT(DISTINCT t.subject_id) as unique_subjects,
        COUNT(DISTINCT t.class_id) as classes_handled,
        ROUND(COUNT(t.id) / NULLIF(COUNT(DISTINCT t.day_of_week),0), 1) as avg_periods_per_day,
        ROUND(COUNT(t.id) * 100.0 / NULLIF(s.max_hours_per_week,0), 1) as workload_pct
       FROM staff s
       LEFT JOIN departments d ON s.department_id = d.id
       LEFT JOIN timetable t ON t.staff_id = s.id AND t.is_active=1 ${ayClause}
       WHERE s.status='active'
       GROUP BY s.id ORDER BY total_periods DESC`,
      params
    );
    return sendSuccess(res, rows);
  } catch (error) { next(error); }
};

// ─── Subject distribution statistics ─────────────────────────────────────────
const getSubjectDistribution = async (req, res, next) => {
  try {
    const { academic_year_id, department_id } = req.query;
    let where = 't.is_active=1';
    const params = [];
    if (academic_year_id) { where += ' AND t.academic_year_id=?'; params.push(academic_year_id); }
    if (department_id)    { where += ' AND c.department_id=?';    params.push(department_id); }

    const [rows] = await pool.execute(
      `SELECT sub.id, sub.subject_name, sub.subject_code, sub.subject_type,
        d.name as dept_name, d.code as dept_code,
        COUNT(t.id) as total_periods,
        COUNT(DISTINCT t.class_id) as classes_count,
        sc.color_hex
       FROM subjects sub
       JOIN departments d ON sub.department_id = d.id
       LEFT JOIN timetable t ON t.subject_id = sub.id AND ${where}
       LEFT JOIN classes c ON t.class_id = c.id
       LEFT JOIN subject_colors sc ON sc.subject_id = sub.id
       GROUP BY sub.id ORDER BY total_periods DESC`,
      params
    );
    return sendSuccess(res, rows);
  } catch (error) { next(error); }
};

// ─── Per-department statistics ────────────────────────────────────────────────
const getDepartmentStats = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT d.id, d.name, d.code, d.hod_name,
        COUNT(DISTINCT s.id) as staff_count,
        COUNT(DISTINCT cl.id) as class_count,
        COUNT(DISTINCT sub.id) as subject_count,
        COUNT(DISTINCT t.id) as timetable_entries,
        SUM(CASE WHEN sub.subject_type='lab' THEN 1 ELSE 0 END) as lab_subjects,
        SUM(CASE WHEN sub.subject_type='theory' THEN 1 ELSE 0 END) as theory_subjects
       FROM departments d
       LEFT JOIN staff s ON s.department_id = d.id AND s.status='active'
       LEFT JOIN classes cl ON cl.department_id = d.id
       LEFT JOIN subjects sub ON sub.department_id = d.id
       LEFT JOIN timetable t ON t.class_id = cl.id AND t.is_active=1
       WHERE d.is_active=1
       GROUP BY d.id ORDER BY d.name`
    );
    return sendSuccess(res, rows);
  } catch (error) { next(error); }
};

// ─── Audit log with filters ───────────────────────────────────────────────────
const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, action, user_id, from_date, to_date } = req.query;
    const offset = (page - 1) * limit;
    let where = '1=1';
    const params = [];

    if (action)    { where += ' AND al.action LIKE ?'; params.push(`%${action}%`); }
    if (user_id)   { where += ' AND al.user_id=?';     params.push(user_id); }
    if (from_date) { where += ' AND DATE(al.created_at) >= ?'; params.push(from_date); }
    if (to_date)   { where += ' AND DATE(al.created_at) <= ?'; params.push(to_date); }

    const [rows] = await pool.execute(
      `SELECT al.*, u.name as user_name, u.role
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE ${where}
       ORDER BY al.created_at DESC
       LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
      params
    );

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total FROM activity_logs al WHERE ${where}`, params
    );

    return sendSuccess(res, {
      logs: rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) }
    });
  } catch (error) { next(error); }
};

// ─── Weekly schedule summary ──────────────────────────────────────────────────
const getWeeklySchedule = async (req, res, next) => {
  try {
    const { academic_year_id, class_id } = req.query;
    const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    let where = 't.is_active=1';
    const params = [];
    if (academic_year_id) { where += ' AND t.academic_year_id=?'; params.push(academic_year_id); }
    if (class_id) { where += ' AND t.class_id=?'; params.push(class_id); }

    const [entries] = await pool.execute(
      `SELECT t.day_of_week, ts.period_number, COUNT(t.id) as period_count
       FROM timetable t JOIN time_slots ts ON t.time_slot_id=ts.id
       WHERE ${where} GROUP BY t.day_of_week, ts.period_number ORDER BY ts.period_number`,
      params
    );

    const weekly = {};
    DAYS.forEach(d => { weekly[d] = 0; });
    entries.forEach(e => { if (weekly[e.day_of_week] !== undefined) weekly[e.day_of_week] += e.period_count; });

    return sendSuccess(res, {
      weekly,
      labels: DAYS,
      data: DAYS.map(d => weekly[d]),
    });
  } catch (error) { next(error); }
};

// ─── Subject colors CRUD ──────────────────────────────────────────────────────
const getSubjectColors = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT sc.*, sub.subject_name, sub.subject_code, sub.subject_type
       FROM subject_colors sc JOIN subjects sub ON sc.subject_id = sub.id`
    );
    const map = {};
    rows.forEach(r => { map[r.subject_id] = r.color_hex; });
    return sendSuccess(res, { colors: rows, map });
  } catch (error) { next(error); }
};

const updateSubjectColor = async (req, res, next) => {
  try {
    const { subject_id, color_hex } = req.body;
    if (!subject_id || !color_hex) return sendSuccess(res, null, 'subject_id and color_hex required');
    await pool.execute(
      'INSERT INTO subject_colors (subject_id,color_hex) VALUES (?,?) ON DUPLICATE KEY UPDATE color_hex=?',
      [subject_id, color_hex, color_hex]
    );
    return sendSuccess(res, { subject_id, color_hex }, 'Color updated.');
  } catch (error) { next(error); }
};

module.exports = {
  getTeacherWorkload, getSubjectDistribution, getDepartmentStats,
  getAuditLogs, getWeeklySchedule, getSubjectColors, updateSubjectColor,
};
