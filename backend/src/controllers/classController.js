const { validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { logActivity } = require('../utils/logger');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', department_id, year, semester } = req.query;
    const offset = (page - 1) * limit;
    const searchParam = `%${search}%`;
    const params = [searchParam, searchParam];
    let where = '(d.name LIKE ? OR c.section LIKE ?)';
    if (department_id) { where += ' AND c.department_id = ?'; params.push(department_id); }
    if (year) { where += ' AND c.year = ?'; params.push(year); }
    if (semester) { where += ' AND c.semester = ?'; params.push(semester); }

    const [rows] = await pool.execute(
      `SELECT c.*, d.name as department_name, d.code as department_code, ay.year_label as academic_year
       FROM classes c
       LEFT JOIN departments d ON c.department_id = d.id
       LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
       WHERE ${where}
       ORDER BY d.name, c.year, c.semester, c.section
       LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
      params
    );

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total FROM classes c LEFT JOIN departments d ON c.department_id = d.id WHERE ${where}`,
      params
    );

    return sendPaginated(res, rows, total, page, limit);
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT c.*, d.name as department_name, d.code as department_code
       FROM classes c LEFT JOIN departments d ON c.department_id = d.id WHERE c.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return sendError(res, 'Class not found.', 404);
    return sendSuccess(res, rows[0]);
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, 'Validation failed', 400, errors.array());

    const { department_id, year, semester, section, strength, academic_year_id } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO classes (department_id, year, semester, section, strength, academic_year_id) VALUES (?, ?, ?, ?, ?, ?)',
      [department_id, year, semester, section.toUpperCase(), strength || 60, academic_year_id || null]
    );
    await logActivity(req.user.id, 'CLASS_CREATE', `Created class: Year ${year} Sem ${semester} Sec ${section}`, req.ip);
    const [rows] = await pool.execute(
      'SELECT c.*, d.name as department_name FROM classes c LEFT JOIN departments d ON c.department_id = d.id WHERE c.id = ?',
      [result.insertId]
    );
    return sendSuccess(res, rows[0], 'Class created successfully.', 201);
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, 'Validation failed', 400, errors.array());

    const { department_id, year, semester, section, strength, academic_year_id } = req.body;
    const [check] = await pool.execute('SELECT id FROM classes WHERE id = ?', [req.params.id]);
    if (!check.length) return sendError(res, 'Class not found.', 404);

    await pool.execute(
      'UPDATE classes SET department_id=?, year=?, semester=?, section=?, strength=?, academic_year_id=? WHERE id=?',
      [department_id, year, semester, section.toUpperCase(), strength || 60, academic_year_id || null, req.params.id]
    );
    await logActivity(req.user.id, 'CLASS_UPDATE', `Updated class id: ${req.params.id}`, req.ip);
    const [rows] = await pool.execute(
      'SELECT c.*, d.name as department_name FROM classes c LEFT JOIN departments d ON c.department_id = d.id WHERE c.id = ?',
      [req.params.id]
    );
    return sendSuccess(res, rows[0], 'Class updated successfully.');
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    const [check] = await pool.execute('SELECT id FROM classes WHERE id = ?', [req.params.id]);
    if (!check.length) return sendError(res, 'Class not found.', 404);

    const [[tt]] = await pool.execute(
      'SELECT COUNT(*) as count FROM timetable WHERE class_id = ? AND is_active = 1', [req.params.id]
    );
    if (tt.count > 0) {
      return sendError(res, 'Cannot delete class with an active timetable. Deactivate the timetable first.', 409);
    }

    await pool.execute('DELETE FROM classes WHERE id = ?', [req.params.id]);
    await logActivity(req.user.id, 'CLASS_DELETE', `Deleted class id: ${req.params.id}`, req.ip);
    return sendSuccess(res, null, 'Class deleted successfully.');
  } catch (error) { next(error); }
};

module.exports = { getAll, getById, create, update, remove };
