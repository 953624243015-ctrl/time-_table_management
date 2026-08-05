/**
 * Conflict Detection Controller
 * Checks teacher, classroom, and subject conflicts before timetable assignment
 */
const { pool } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

// ─── Check all conflicts for a proposed assignment ────────────────────────────
const checkConflicts = async (req, res, next) => {
  try {
    const { staff_id, room_id, subject_id, class_id, time_slot_id, day_of_week, academic_year_id, exclude_id } = req.body;
    const conflicts = [];
    const excl = exclude_id ? 'AND t.id != ?' : '';
    const exclParam = exclude_id ? [exclude_id] : [];

    // 1. Teacher double-booking
    if (staff_id && time_slot_id && day_of_week) {
      const [teacherConflict] = await pool.execute(
        `SELECT t.id, c.section, c.year, c.semester, d.name as dept, sub.subject_name
         FROM timetable t
         JOIN classes c ON t.class_id = c.id
         JOIN departments d ON c.department_id = d.id
         JOIN subjects sub ON t.subject_id = sub.id
         WHERE t.staff_id=? AND t.time_slot_id=? AND t.day_of_week=?
         AND t.is_active=1 ${excl}`,
        [staff_id, time_slot_id, day_of_week, ...exclParam]
      );
      if (teacherConflict.length > 0) {
        const c = teacherConflict[0];
        conflicts.push({
          type: 'teacher',
          severity: 'error',
          message: `Teacher is already assigned to ${c.dept} Y${c.year} S${c.semester} Sec-${c.section} (${c.subject_name}) at this time.`,
        });
      }
    }

    // 2. Classroom double-booking
    if (room_id && time_slot_id && day_of_week) {
      const [roomConflict] = await pool.execute(
        `SELECT t.id, c.section, c.year, d.name as dept, sub.subject_name
         FROM timetable t
         JOIN classes c ON t.class_id = c.id
         JOIN departments d ON c.department_id = d.id
         JOIN subjects sub ON t.subject_id = sub.id
         WHERE t.room_id=? AND t.time_slot_id=? AND t.day_of_week=?
         AND t.is_active=1 ${excl}`,
        [room_id, time_slot_id, day_of_week, ...exclParam]
      );
      if (roomConflict.length > 0) {
        const c = roomConflict[0];
        conflicts.push({
          type: 'room',
          severity: 'error',
          message: `Room is already occupied by ${c.dept} Y${c.year} Sec-${c.section} (${c.subject_name}) at this time.`,
        });
      }
    }

    // 3. Class double-booking (same class, same slot)
    if (class_id && time_slot_id && day_of_week) {
      const [classConflict] = await pool.execute(
        `SELECT t.id, sub.subject_name FROM timetable t
         JOIN subjects sub ON t.subject_id = sub.id
         WHERE t.class_id=? AND t.time_slot_id=? AND t.day_of_week=?
         AND t.is_active=1 ${excl}`,
        [class_id, time_slot_id, day_of_week, ...exclParam]
      );
      if (classConflict.length > 0) {
        conflicts.push({
          type: 'class',
          severity: 'error',
          message: `This class already has ${classConflict[0].subject_name} scheduled at this time.`,
        });
      }
    }

    // 4. Subject duplicate in same day for same class
    if (subject_id && class_id && day_of_week) {
      const [subjConflict] = await pool.execute(
        `SELECT COUNT(*) as cnt FROM timetable t
         WHERE t.subject_id=? AND t.class_id=? AND t.day_of_week=?
         AND t.is_active=1 ${excl}`,
        [subject_id, class_id, day_of_week, ...exclParam]
      );
      const cnt = subjConflict[0].cnt;
      if (cnt >= 2) {
        conflicts.push({
          type: 'subject',
          severity: 'warning',
          message: `Subject already appears ${cnt} time(s) on ${day_of_week} for this class.`,
        });
      }
    }

    const hasErrors = conflicts.some(c => c.severity === 'error');
    return sendSuccess(res, { conflicts, hasErrors, conflictCount: conflicts.length });
  } catch (error) { next(error); }
};

// ─── Get all current conflicts in the full timetable ─────────────────────────
const getFullConflictReport = async (req, res, next) => {
  try {
    const { academic_year_id } = req.query;
    const ayClause = academic_year_id ? 'AND t.academic_year_id = ?' : '';
    const params = academic_year_id ? [academic_year_id] : [];

    // Teacher conflicts
    const [teacherClash] = await pool.execute(
      `SELECT s.name as staff_name, ts.slot_name, t.day_of_week,
        COUNT(t.id) as clash_count,
        GROUP_CONCAT(DISTINCT CONCAT(d.code,'-',c.section) ORDER BY c.section) as classes
       FROM timetable t
       JOIN staff s ON t.staff_id = s.id
       JOIN time_slots ts ON t.time_slot_id = ts.id
       JOIN classes c ON t.class_id = c.id
       JOIN departments d ON c.department_id = d.id
       WHERE t.is_active = 1 ${ayClause}
       GROUP BY t.staff_id, t.time_slot_id, t.day_of_week
       HAVING clash_count > 1`,
      params
    );

    // Room conflicts
    const [roomClash] = await pool.execute(
      `SELECT r.room_number, ts.slot_name, t.day_of_week,
        COUNT(t.id) as clash_count,
        GROUP_CONCAT(DISTINCT CONCAT(d.code,'-',c.section)) as classes
       FROM timetable t
       JOIN rooms r ON t.room_id = r.id
       JOIN time_slots ts ON t.time_slot_id = ts.id
       JOIN classes c ON t.class_id = c.id
       JOIN departments d ON c.department_id = d.id
       WHERE t.is_active = 1 ${ayClause}
       GROUP BY t.room_id, t.time_slot_id, t.day_of_week
       HAVING clash_count > 1`,
      params
    );

    return sendSuccess(res, {
      teacherConflicts: teacherClash,
      roomConflicts: roomClash,
      totalConflicts: teacherClash.length + roomClash.length,
      isClean: teacherClash.length === 0 && roomClash.length === 0,
    });
  } catch (error) { next(error); }
};

module.exports = { checkConflicts, getFullConflictReport };
