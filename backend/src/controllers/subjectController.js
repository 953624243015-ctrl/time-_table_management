const { validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { logActivity } = require('../utils/logger');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', department_id, semester, subject_type } = req.query;
    const offset = (page - 1) * limit;
    const searchParam = `%${search}%`;
    const params = [searchParam, searchParam, searchParam];
    let where = '(sub.subject_name LIKE ? OR sub.subject_code LIKE ? OR d.name LIKE ?)';
    if (department_id) { where += ' AND sub.department_id = ?'; params.push(department_id); }
    if (semester) { where += ' AND sub.semester = ?'; params.push(semester); }
    if (subject_type) { where += ' AND sub.subject_type = ?'; params.push(subject_type); }

    const [rows] = await pool.execute(
      `SELECT sub.*, d.name as department_name, d.code as department_code,
        GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ', ') as assigned_faculty
       FROM subjects sub
       LEFT JOIN departments d ON sub.department_id = d.id
       LEFT JOIN subject_faculty sf ON sub.id = sf.subject_id
       LEFT JOIN staff s ON sf.staff_id = s.id
       WHERE ${where}
       GROUP BY sub.id
       ORDER BY sub.department_id, sub.semester, sub.subject_name
       LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
      params
    );

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total FROM subjects sub
       LEFT JOIN departments d ON sub.department_id = d.id WHERE ${where}`,
      params
    );

    return sendPaginated(res, rows, total, page, limit);
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT sub.*, d.name as department_name FROM subjects sub
       LEFT JOIN departments d ON sub.department_id = d.id WHERE sub.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return sendError(res, 'Subject not found.', 404);

    const [faculty] = await pool.execute(
      `SELECT sf.*, s.name as staff_name, s.staff_id, c.year, c.section
       FROM subject_faculty sf
       JOIN staff s ON sf.staff_id = s.id
       LEFT JOIN classes c ON sf.class_id = c.id
       WHERE sf.subject_id = ?`,
      [req.params.id]
    );

    return sendSuccess(res, { ...rows[0], faculty });
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, 'Validation failed', 400, errors.array());

    const { subject_code, subject_name, department_id, semester, hours_per_week, subject_type, credits, faculty_assignments } = req.body;
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [result] = await conn.execute(
        'INSERT INTO subjects (subject_code, subject_name, department_id, semester, hours_per_week, subject_type, credits) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [subject_code, subject_name, department_id, semester, hours_per_week || 3, subject_type || 'theory', credits || 3]
      );
      const subjId = result.insertId;
      if (faculty_assignments && faculty_assignments.length > 0) {
        for (const fa of faculty_assignments) {
          await conn.execute(
            'INSERT IGNORE INTO subject_faculty (subject_id, staff_id, class_id) VALUES (?, ?, ?)',
            [subjId, fa.staff_id, fa.class_id || null]
          );
        }
      }
      await conn.commit();
      await logActivity(req.user.id, 'SUBJ_CREATE', `Created subject: ${subject_name}`, req.ip);
      const [rows] = await pool.execute(
        'SELECT sub.*, d.name as department_name FROM subjects sub LEFT JOIN departments d ON sub.department_id = d.id WHERE sub.id = ?',
        [subjId]
      );
      return sendSuccess(res, rows[0], 'Subject created successfully.', 201);
    } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, 'Validation failed', 400, errors.array());

    const { subject_code, subject_name, department_id, semester, hours_per_week, subject_type, credits } = req.body;
    const [check] = await pool.execute('SELECT id FROM subjects WHERE id = ?', [req.params.id]);
    if (!check.length) return sendError(res, 'Subject not found.', 404);

    await pool.execute(
      'UPDATE subjects SET subject_code=?, subject_name=?, department_id=?, semester=?, hours_per_week=?, subject_type=?, credits=? WHERE id=?',
      [subject_code, subject_name, department_id, semester, hours_per_week || 3, subject_type || 'theory', credits || 3, req.params.id]
    );
    await logActivity(req.user.id, 'SUBJ_UPDATE', `Updated subject: ${subject_name}`, req.ip);
    const [rows] = await pool.execute(
      'SELECT sub.*, d.name as department_name FROM subjects sub LEFT JOIN departments d ON sub.department_id = d.id WHERE sub.id = ?',
      [req.params.id]
    );
    return sendSuccess(res, rows[0], 'Subject updated successfully.');
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    const [check] = await pool.execute('SELECT id, subject_name FROM subjects WHERE id = ?', [req.params.id]);
    if (!check.length) return sendError(res, 'Subject not found.', 404);
    await pool.execute('DELETE FROM subjects WHERE id = ?', [req.params.id]);
    await logActivity(req.user.id, 'SUBJ_DELETE', `Deleted subject: ${check[0].subject_name}`, req.ip);
    return sendSuccess(res, null, 'Subject deleted successfully.');
  } catch (error) { next(error); }
};

const assignFaculty = async (req, res, next) => {
  try {
    const { staff_id, class_id } = req.body;
    const subjId = req.params.id;
    await pool.execute(
      'INSERT INTO subject_faculty (subject_id, staff_id, class_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE staff_id = ?',
      [subjId, staff_id, class_id || null, staff_id]
    );
    return sendSuccess(res, null, 'Faculty assigned successfully.');
  } catch (error) { next(error); }
};

module.exports = { getAll, getById, create, update, remove, assignFaculty };
