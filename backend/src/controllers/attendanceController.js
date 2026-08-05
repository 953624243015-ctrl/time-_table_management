/**
 * Attendance Controller
 * Manage class attendance records
 */
const { pool } = require('../config/database');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { logActivity } = require('../utils/logger');

// ─── Get attendance for a class on a date ────────────────────────────────────
const getAttendance = async (req, res, next) => {
  try {
    const { class_id, date, staff_id, month, year } = req.query;
    let where = 'a.id IS NOT NULL';
    const params = [];

    if (class_id) { where += ' AND a.class_id = ?'; params.push(class_id); }
    if (staff_id) { where += ' AND a.staff_id = ?'; params.push(staff_id); }
    if (date)     { where += ' AND a.attendance_date = ?'; params.push(date); }
    if (month && year) {
      where += ' AND MONTH(a.attendance_date) = ? AND YEAR(a.attendance_date) = ?';
      params.push(month, year);
    }

    const [rows] = await pool.execute(
      `SELECT a.*,
        c.year as class_year, c.semester, c.section,
        d.name as dept_name, d.code as dept_code,
        sub.subject_name, sub.subject_code,
        s.name as staff_name,
        ts.slot_name, ts.start_time, ts.end_time,
        u.name as created_by_name
       FROM attendance a
       JOIN classes c ON a.class_id = c.id
       JOIN departments d ON c.department_id = d.id
       JOIN subjects sub ON a.subject_id = sub.id
       JOIN staff s ON a.staff_id = s.id
       JOIN time_slots ts ON a.time_slot_id = ts.id
       LEFT JOIN users u ON a.created_by = u.id
       WHERE ${where}
       ORDER BY a.attendance_date DESC, ts.period_number`,
      params
    );

    return sendSuccess(res, rows);
  } catch (error) { next(error); }
};

// ─── Mark / update attendance ─────────────────────────────────────────────────
const markAttendance = async (req, res, next) => {
  try {
    const {
      timetable_id, class_id, subject_id, staff_id,
      attendance_date, day_of_week, time_slot_id, status, remarks,
    } = req.body;

    if (!class_id || !subject_id || !staff_id || !attendance_date || !time_slot_id) {
      return sendError(res, 'class_id, subject_id, staff_id, attendance_date and time_slot_id are required.', 400);
    }

    const [existing] = await pool.execute(
      'SELECT id FROM attendance WHERE class_id=? AND attendance_date=? AND time_slot_id=?',
      [class_id, attendance_date, time_slot_id]
    );

    if (existing.length) {
      await pool.execute(
        'UPDATE attendance SET status=?, remarks=?, created_by=? WHERE id=?',
        [status || 'conducted', remarks || null, req.user.id, existing[0].id]
      );
      const [updated] = await pool.execute('SELECT * FROM attendance WHERE id=?', [existing[0].id]);
      return sendSuccess(res, updated[0], 'Attendance updated.');
    } else {
      const [result] = await pool.execute(
        `INSERT INTO attendance
         (timetable_id,class_id,subject_id,staff_id,attendance_date,day_of_week,time_slot_id,status,remarks,created_by)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [timetable_id || null, class_id, subject_id, staff_id,
         attendance_date, day_of_week || 'Monday', time_slot_id,
         status || 'conducted', remarks || null, req.user.id]
      );
      await logActivity(req.user.id, 'ATTENDANCE_MARK',
        `Attendance marked for class ${class_id} on ${attendance_date}`, req.ip);
      const [inserted] = await pool.execute('SELECT * FROM attendance WHERE id=?', [result.insertId]);
      return sendSuccess(res, inserted[0], 'Attendance marked.', 201);
    }
  } catch (error) { next(error); }
};

// ─── Bulk mark attendance for a class / day ───────────────────────────────────
const bulkMarkAttendance = async (req, res, next) => {
  try {
    const { records } = req.body; // array of attendance objects
    if (!records || !records.length) return sendError(res, 'records array is required.', 400);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      let count = 0;
      for (const rec of records) {
        await conn.execute(
          `INSERT INTO attendance
           (timetable_id,class_id,subject_id,staff_id,attendance_date,day_of_week,time_slot_id,status,remarks,created_by)
           VALUES (?,?,?,?,?,?,?,?,?,?)
           ON DUPLICATE KEY UPDATE status=VALUES(status), remarks=VALUES(remarks), created_by=VALUES(created_by)`,
          [rec.timetable_id || null, rec.class_id, rec.subject_id, rec.staff_id,
           rec.attendance_date, rec.day_of_week || 'Monday', rec.time_slot_id,
           rec.status || 'conducted', rec.remarks || null, req.user.id]
        );
        count++;
      }
      await conn.commit();
      return sendSuccess(res, { count }, `${count} attendance records saved.`);
    } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
  } catch (error) { next(error); }
};

// ─── Get today's attendance summary ──────────────────────────────────────────
const getTodaySummary = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];

    const [todayClasses] = await pool.execute(
      `SELECT t.id as timetable_id, t.class_id, t.subject_id, t.staff_id, t.room_id,
        t.day_of_week, ts.slot_name, ts.start_time, ts.end_time,
        sub.subject_name, sub.subject_code, sub.subject_type,
        s.name as staff_name,
        c.year, c.semester, c.section,
        d.name as dept_name, r.room_number,
        a.status as attendance_status
       FROM timetable t
       JOIN time_slots ts ON t.time_slot_id = ts.id
       JOIN subjects sub ON t.subject_id = sub.id
       JOIN staff s ON t.staff_id = s.id
       JOIN classes c ON t.class_id = c.id
       JOIN departments d ON c.department_id = d.id
       JOIN rooms r ON t.room_id = r.id
       LEFT JOIN attendance a ON a.timetable_id = t.id AND a.attendance_date = ?
       WHERE t.day_of_week = ? AND t.is_active = 1
       ORDER BY ts.period_number, d.code, c.section`,
      [today, dayName]
    );

    const conducted = todayClasses.filter(c => c.attendance_status === 'conducted').length;
    const pending   = todayClasses.filter(c => !c.attendance_status).length;

    return sendSuccess(res, {
      date: today,
      day: dayName,
      totalClasses: todayClasses.length,
      conducted,
      pending,
      cancelled: todayClasses.filter(c => c.attendance_status === 'cancelled').length,
      classes: todayClasses,
    });
  } catch (error) { next(error); }
};

module.exports = { getAttendance, markAttendance, bulkMarkAttendance, getTodaySummary };
