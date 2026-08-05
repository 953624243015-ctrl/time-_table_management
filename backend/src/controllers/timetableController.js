const { pool } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const { logActivity } = require('../utils/logger');
const { runGeneticAlgorithm } = require('../ai/geneticAlgorithm');

// ─── Generate Timetable ───────────────────────────────────────────────────────

const generateTimetable = async (req, res, next) => {
  try {
    const { department_id, semester, academic_year_id } = req.body;
    if (!department_id || !semester || !academic_year_id) {
      return sendError(res, 'department_id, semester, and academic_year_id are required.', 400);
    }

    // Log generation start
    const [logResult] = await pool.execute(
      `INSERT INTO timetable_generation_log (department_id, semester, academic_year_id, status, generated_by)
       VALUES (?, ?, ?, 'running', ?)`,
      [department_id, semester, academic_year_id, req.user.id]
    );
    const logId = logResult.insertId;

    // Fetch data
    const [classes] = await pool.execute(
      'SELECT * FROM classes WHERE department_id = ? AND semester = ? AND academic_year_id = ?',
      [department_id, semester, academic_year_id]
    );
    if (!classes.length) {
      await pool.execute("UPDATE timetable_generation_log SET status='failed' WHERE id=?", [logId]);
      return sendError(res, 'No classes found for the specified criteria.', 404);
    }

    const classIds = classes.map(c => c.id);
    const placeholders = classIds.map(() => '?').join(',');

    const [assignments] = await pool.execute(
      `SELECT sf.*, s.status as staff_status, s.max_hours_per_week
       FROM subject_faculty sf
       JOIN staff s ON sf.staff_id = s.id
       WHERE sf.class_id IN (${placeholders}) AND s.status = 'active'`,
      classIds
    );

    if (!assignments.length) {
      await pool.execute("UPDATE timetable_generation_log SET status='failed' WHERE id=?", [logId]);
      return sendError(res, 'No faculty-subject assignments found. Please assign faculty to subjects first.', 404);
    }

    const [subjects] = await pool.execute(
      `SELECT * FROM subjects WHERE department_id = ? AND semester = ?`, [department_id, semester]
    );
    const subjectsMap = {};
    subjects.forEach(s => { subjectsMap[s.id] = s; });

    const [rooms] = await pool.execute('SELECT * FROM rooms WHERE is_active = 1');
    const [timeSlots] = await pool.execute('SELECT * FROM time_slots WHERE is_active = 1 ORDER BY period_number');

    // Get academic settings for working days
    const [settings] = await pool.execute(
      "SELECT setting_value FROM academic_settings WHERE setting_key = 'working_days'"
    );
    const workingDays = settings.length
      ? settings[0].setting_value.split(',').map(d => d.trim())
      : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    // Get staff availability
    const staffIds = [...new Set(assignments.map(a => a.staff_id))];
    const staffPlaceholders = staffIds.map(() => '?').join(',');
    const [availability] = await pool.execute(
      `SELECT staff_id, day_of_week, is_available FROM staff_availability WHERE staff_id IN (${staffPlaceholders})`,
      staffIds
    );
    const staffAvailMap = {};
    availability.forEach(a => {
      staffAvailMap[`${a.staff_id}_${a.day_of_week}`] = a.is_available === 1;
    });

    // Run Genetic Algorithm
    const { chromosome, fitnessScore, conflicts, generations } = await runGeneticAlgorithm(
      assignments, subjectsMap, rooms, timeSlots, workingDays, staffAvailMap
    );

    // Delete existing timetable entries for these classes (avoids unique constraint violations on regenerate)
    if (classIds.length > 0) {
      await pool.execute(
        `DELETE FROM timetable WHERE class_id IN (${placeholders}) AND academic_year_id = ?`,
        [...classIds, academic_year_id]
      );
    }

    // Insert new timetable
    let inserted = 0;
    const seen = new Set();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const gene of chromosome) {
        const dupKey = `${gene.classId}_${gene.timeSlotId}_${gene.day}`;
        if (seen.has(dupKey)) continue;
        seen.add(dupKey);

        await conn.execute(
          `INSERT INTO timetable (class_id, subject_id, staff_id, room_id, time_slot_id, day_of_week, academic_year_id, generation, fitness_score, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [gene.classId, gene.subjectId, gene.staffId, gene.roomId, gene.timeSlotId, gene.day, academic_year_id, generations, fitnessScore]
        );
        inserted++;
      }
      await conn.commit();
    } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }

    // Update generation log
    await pool.execute(
      `UPDATE timetable_generation_log SET status='completed', generation_count=?, fitness_score=?, conflict_count=?, completed_at=NOW() WHERE id=?`,
      [generations, fitnessScore, conflicts, logId]
    );

    await logActivity(req.user.id, 'TIMETABLE_GENERATE',
      `Generated timetable for dept ${department_id} sem ${semester} — ${inserted} entries, fitness ${fitnessScore}`, req.ip);

    return sendSuccess(res, {
      generated: inserted,
      fitnessScore,
      conflicts,
      generations,
      optimizationStatus: conflicts === 0 ? 'optimal' : conflicts < 5 ? 'good' : 'acceptable',
    }, `Timetable generated successfully. ${inserted} schedule entries created.`);
  } catch (error) { next(error); }
};

// ─── Get Class Timetable ──────────────────────────────────────────────────────

const getClassTimetable = async (req, res, next) => {
  try {
    const { academic_year_id } = req.query;
    let query = `
      SELECT t.*, ts.slot_name, ts.start_time, ts.end_time, ts.period_number,
        sub.subject_name, sub.subject_code, sub.subject_type,
        s.name as staff_name, s.staff_id as staff_code,
        r.room_number, r.room_type,
        c.year, c.semester, c.section, d.name as department_name
      FROM timetable t
      JOIN time_slots ts ON t.time_slot_id = ts.id
      JOIN subjects sub ON t.subject_id = sub.id
      JOIN staff s ON t.staff_id = s.id
      JOIN rooms r ON t.room_id = r.id
      JOIN classes c ON t.class_id = c.id
      JOIN departments d ON c.department_id = d.id
      WHERE t.class_id = ? AND t.is_active = 1`;
    const params = [req.params.id];
    if (academic_year_id) { query += ' AND t.academic_year_id = ?'; params.push(academic_year_id); }
    query += ' ORDER BY FIELD(t.day_of_week,"Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"), ts.period_number';

    const [rows] = await pool.execute(query, params);
    const grouped = groupByDayAndPeriod(rows);
    return sendSuccess(res, { entries: rows, grouped });
  } catch (error) { next(error); }
};

// ─── Get Staff Timetable ──────────────────────────────────────────────────────

const getStaffTimetable = async (req, res, next) => {
  try {
    const { academic_year_id } = req.query;
    let query = `
      SELECT t.*, ts.slot_name, ts.start_time, ts.end_time, ts.period_number,
        sub.subject_name, sub.subject_code, sub.subject_type,
        r.room_number, r.room_type,
        c.year, c.semester, c.section, d.name as department_name,
        s.name as staff_name, s.staff_id as staff_code
      FROM timetable t
      JOIN time_slots ts ON t.time_slot_id = ts.id
      JOIN subjects sub ON t.subject_id = sub.id
      JOIN rooms r ON t.room_id = r.id
      JOIN classes c ON t.class_id = c.id
      JOIN departments d ON c.department_id = d.id
      JOIN staff s ON t.staff_id = s.id
      WHERE t.staff_id = ? AND t.is_active = 1`;
    const params = [req.params.id];
    if (academic_year_id) { query += ' AND t.academic_year_id = ?'; params.push(academic_year_id); }
    query += ' ORDER BY FIELD(t.day_of_week,"Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"), ts.period_number';

    const [rows] = await pool.execute(query, params);
    const grouped = groupByDayAndPeriod(rows);
    return sendSuccess(res, { entries: rows, grouped });
  } catch (error) { next(error); }
};

// ─── Get Room Timetable ───────────────────────────────────────────────────────

const getRoomTimetable = async (req, res, next) => {
  try {
    const { academic_year_id } = req.query;
    let query = `
      SELECT t.*, ts.slot_name, ts.start_time, ts.end_time, ts.period_number,
        sub.subject_name, sub.subject_code, sub.subject_type,
        s.name as staff_name,
        c.year, c.semester, c.section, d.name as department_name,
        r.room_number, r.room_type
      FROM timetable t
      JOIN time_slots ts ON t.time_slot_id = ts.id
      JOIN subjects sub ON t.subject_id = sub.id
      JOIN staff s ON t.staff_id = s.id
      JOIN classes c ON t.class_id = c.id
      JOIN departments d ON c.department_id = d.id
      JOIN rooms r ON t.room_id = r.id
      WHERE t.room_id = ? AND t.is_active = 1`;
    const params = [req.params.id];
    if (academic_year_id) { query += ' AND t.academic_year_id = ?'; params.push(academic_year_id); }
    query += ' ORDER BY FIELD(t.day_of_week,"Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"), ts.period_number';

    const [rows] = await pool.execute(query, params);
    const grouped = groupByDayAndPeriod(rows);
    return sendSuccess(res, { entries: rows, grouped });
  } catch (error) { next(error); }
};

// ─── Get Department Timetable ─────────────────────────────────────────────────

const getDepartmentTimetable = async (req, res, next) => {
  try {
    const { semester, academic_year_id } = req.query;
    let query = `
      SELECT t.*, ts.slot_name, ts.start_time, ts.end_time, ts.period_number,
        sub.subject_name, sub.subject_code, sub.subject_type,
        s.name as staff_name,
        r.room_number, r.room_type,
        c.year, c.semester, c.section, d.name as department_name
      FROM timetable t
      JOIN time_slots ts ON t.time_slot_id = ts.id
      JOIN subjects sub ON t.subject_id = sub.id
      JOIN staff s ON t.staff_id = s.id
      JOIN rooms r ON t.room_id = r.id
      JOIN classes c ON t.class_id = c.id
      JOIN departments d ON c.department_id = d.id
      WHERE c.department_id = ? AND t.is_active = 1`;
    const params = [req.params.id];
    if (semester) { query += ' AND c.semester = ?'; params.push(semester); }
    if (academic_year_id) { query += ' AND t.academic_year_id = ?'; params.push(academic_year_id); }
    query += ' ORDER BY c.year, c.section, FIELD(t.day_of_week,"Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"), ts.period_number';

    const [rows] = await pool.execute(query, params);
    return sendSuccess(res, rows);
  } catch (error) { next(error); }
};

// ─── List all generated timetables ───────────────────────────────────────────

const listTimetables = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT gl.*, d.name as department_name, ay.year_label, u.name as generated_by_name
       FROM timetable_generation_log gl
       LEFT JOIN departments d ON gl.department_id = d.id
       LEFT JOIN academic_years ay ON gl.academic_year_id = ay.id
       LEFT JOIN users u ON gl.generated_by = u.id
       ORDER BY gl.started_at DESC LIMIT 50`
    );
    return sendSuccess(res, rows);
  } catch (error) { next(error); }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupByDayAndPeriod(rows) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const grouped = {};
  days.forEach(day => { grouped[day] = {}; });
  rows.forEach(row => {
    if (!grouped[row.day_of_week]) grouped[row.day_of_week] = {};
    grouped[row.day_of_week][row.period_number] = row;
  });
  return grouped;
}

module.exports = { generateTimetable, getClassTimetable, getStaffTimetable, getRoomTimetable, getDepartmentTimetable, listTimetables };
