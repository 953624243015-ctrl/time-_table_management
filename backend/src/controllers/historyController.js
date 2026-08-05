/**
 * Timetable History / Versioning Controller
 */
const { pool } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const { logActivity } = require('../utils/logger');

// ─── Save a snapshot of the current timetable as a version ───────────────────
const saveVersion = async (req, res, next) => {
  try {
    const { department_id, semester, academic_year_id, version_label } = req.body;
    if (!department_id || !semester || !academic_year_id) {
      return sendError(res, 'department_id, semester and academic_year_id are required.', 400);
    }

    // Fetch current timetable entries
    const [entries] = await pool.execute(
      `SELECT t.*, ts.slot_name, ts.start_time, ts.end_time, ts.period_number,
        sub.subject_name, sub.subject_code, sub.subject_type,
        s.name as staff_name, r.room_number,
        c.year, c.semester, c.section, d.name as dept_name
       FROM timetable t
       JOIN time_slots ts ON t.time_slot_id = ts.id
       JOIN subjects sub ON t.subject_id = sub.id
       JOIN staff s ON t.staff_id = s.id
       JOIN rooms r ON t.room_id = r.id
       JOIN classes c ON t.class_id = c.id
       JOIN departments d ON c.department_id = d.id
       WHERE c.department_id=? AND c.semester=? AND t.academic_year_id=? AND t.is_active=1
       ORDER BY t.day_of_week, ts.period_number`,
      [department_id, semester, academic_year_id]
    );

    if (!entries.length) return sendError(res, 'No active timetable found to snapshot.', 404);

    // Calculate next version number
    const [[{ maxVersion }]] = await pool.execute(
      'SELECT COALESCE(MAX(version_number),0) as maxVersion FROM timetable_history WHERE department_id=? AND semester=? AND academic_year_id=?',
      [department_id, semester, academic_year_id]
    );

    const fitnessScores = entries.map(e => parseFloat(e.fitness_score || 0));
    const avgFitness = fitnessScores.length
      ? (fitnessScores.reduce((a, b) => a + b, 0) / fitnessScores.length).toFixed(2)
      : 0;

    const [result] = await pool.execute(
      `INSERT INTO timetable_history
       (department_id,semester,academic_year_id,version_number,version_label,snapshot,fitness_score,total_entries,created_by)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [department_id, semester, academic_year_id, maxVersion + 1,
       version_label || `Version ${maxVersion + 1}`,
       JSON.stringify(entries), avgFitness, entries.length, req.user.id]
    );

    await logActivity(req.user.id, 'TIMETABLE_SNAPSHOT',
      `Snapshot v${maxVersion + 1} saved for dept ${department_id} sem ${semester}`, req.ip);

    return sendSuccess(res, { id: result.insertId, version_number: maxVersion + 1 },
      `Timetable version ${maxVersion + 1} saved.`, 201);
  } catch (error) { next(error); }
};

// ─── List all versions for a dept/sem ────────────────────────────────────────
const listVersions = async (req, res, next) => {
  try {
    const { department_id, semester, academic_year_id } = req.query;
    let where = '1=1';
    const params = [];
    if (department_id) { where += ' AND h.department_id=?'; params.push(department_id); }
    if (semester)      { where += ' AND h.semester=?';      params.push(semester); }
    if (academic_year_id) { where += ' AND h.academic_year_id=?'; params.push(academic_year_id); }

    const [rows] = await pool.execute(
      `SELECT h.id, h.version_number, h.version_label, h.fitness_score, h.total_entries,
        h.is_active, h.created_at, u.name as created_by_name,
        d.name as dept_name, d.code as dept_code, ay.year_label
       FROM timetable_history h
       LEFT JOIN departments d ON h.department_id = d.id
       LEFT JOIN academic_years ay ON h.academic_year_id = ay.id
       LEFT JOIN users u ON h.created_by = u.id
       WHERE ${where}
       ORDER BY h.created_at DESC`,
      params
    );
    return sendSuccess(res, rows);
  } catch (error) { next(error); }
};

// ─── Get a specific version snapshot ─────────────────────────────────────────
const getVersion = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT h.*, d.name as dept_name, ay.year_label, u.name as created_by_name
       FROM timetable_history h
       LEFT JOIN departments d ON h.department_id = d.id
       LEFT JOIN academic_years ay ON h.academic_year_id = ay.id
       LEFT JOIN users u ON h.created_by = u.id
       WHERE h.id=?`,
      [req.params.id]
    );
    if (!rows.length) return sendError(res, 'Version not found.', 404);
    const version = rows[0];
    version.snapshot = typeof version.snapshot === 'string'
      ? JSON.parse(version.snapshot) : version.snapshot;
    return sendSuccess(res, version);
  } catch (error) { next(error); }
};

// ─── Restore a version (replace active timetable) ────────────────────────────
const restoreVersion = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM timetable_history WHERE id=?', [req.params.id]);
    if (!rows.length) return sendError(res, 'Version not found.', 404);

    const version = rows[0];
    const snapshot = typeof version.snapshot === 'string'
      ? JSON.parse(version.snapshot) : version.snapshot;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Deactivate current timetable entries for this dept/sem
      const [classes] = await conn.execute(
        'SELECT id FROM classes WHERE department_id=? AND semester=?',
        [version.department_id, version.semester]
      );
      if (classes.length) {
        const ids = classes.map(c => c.id);
        const ph  = ids.map(() => '?').join(',');
        await conn.execute(
          `UPDATE timetable SET is_active=0 WHERE class_id IN (${ph}) AND academic_year_id=?`,
          [...ids, version.academic_year_id]
        );
      }

      // Re-insert snapshot entries
      let restored = 0;
      const seen = new Set();
      for (const entry of snapshot) {
        const key = `${entry.class_id}_${entry.time_slot_id}_${entry.day_of_week}`;
        if (seen.has(key)) continue;
        seen.add(key);
        await conn.execute(
          `INSERT INTO timetable
           (class_id,subject_id,staff_id,room_id,time_slot_id,day_of_week,academic_year_id,generation,fitness_score,is_active)
           VALUES (?,?,?,?,?,?,?,?,?,1)`,
          [entry.class_id, entry.subject_id, entry.staff_id, entry.room_id,
           entry.time_slot_id, entry.day_of_week, version.academic_year_id,
           entry.generation || 1, entry.fitness_score || 0]
        );
        restored++;
      }

      // Mark this version as active
      await conn.execute('UPDATE timetable_history SET is_active=1 WHERE id=?', [version.id]);

      await conn.commit();
      await logActivity(req.user.id, 'TIMETABLE_RESTORE',
        `Restored version ${version.version_number} for dept ${version.department_id}`, req.ip);

      return sendSuccess(res, { restored }, `Timetable restored from version ${version.version_number}. ${restored} entries restored.`);
    } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
  } catch (error) { next(error); }
};

module.exports = { saveVersion, listVersions, getVersion, restoreVersion };
