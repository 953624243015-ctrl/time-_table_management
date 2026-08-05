const { validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { logActivity } = require('../utils/logger');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', sort = 'name', order = 'ASC' } = req.query;
    const offset = (page - 1) * limit;
    const allowedSorts = ['name', 'code', 'hod_name', 'created_at'];
    const sortField = allowedSorts.includes(sort) ? sort : 'name';
    const sortOrder = order === 'DESC' ? 'DESC' : 'ASC';

    const searchParam = `%${search}%`;
    const [rows] = await pool.execute(
      `SELECT d.*, 
        (SELECT COUNT(*) FROM staff WHERE department_id = d.id AND status = 'active') as staff_count,
        (SELECT COUNT(*) FROM classes WHERE department_id = d.id) as class_count,
        (SELECT COUNT(*) FROM subjects WHERE department_id = d.id) as subject_count
       FROM departments d
       WHERE (d.name LIKE ? OR d.code LIKE ? OR d.hod_name LIKE ?)
       ORDER BY ${sortField} ${sortOrder}
       LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
      [searchParam, searchParam, searchParam]
    );

    const [[{ total }]] = await pool.execute(
      'SELECT COUNT(*) as total FROM departments WHERE name LIKE ? OR code LIKE ? OR hod_name LIKE ?',
      [searchParam, searchParam, searchParam]
    );

    return sendPaginated(res, rows, total, page, limit);
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT d.*, 
        (SELECT COUNT(*) FROM staff WHERE department_id = d.id AND status = 'active') as staff_count,
        (SELECT COUNT(*) FROM classes WHERE department_id = d.id) as class_count
       FROM departments d WHERE d.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return sendError(res, 'Department not found.', 404);
    return sendSuccess(res, rows[0]);
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, 'Validation failed', 400, errors.array());

    const { name, code, hod_name } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO departments (name, code, hod_name) VALUES (?, ?, ?)',
      [name.trim(), code.trim().toUpperCase(), hod_name?.trim() || null]
    );
    await logActivity(req.user.id, 'DEPT_CREATE', `Created department: ${name}`, req.ip);
    const [rows] = await pool.execute('SELECT * FROM departments WHERE id = ?', [result.insertId]);
    return sendSuccess(res, rows[0], 'Department created successfully.', 201);
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, 'Validation failed', 400, errors.array());

    const { name, code, hod_name, is_active } = req.body;
    const [check] = await pool.execute('SELECT id FROM departments WHERE id = ?', [req.params.id]);
    if (!check.length) return sendError(res, 'Department not found.', 404);

    await pool.execute(
      'UPDATE departments SET name = ?, code = ?, hod_name = ?, is_active = ? WHERE id = ?',
      [name.trim(), code.trim().toUpperCase(), hod_name?.trim() || null, is_active ?? 1, req.params.id]
    );
    await logActivity(req.user.id, 'DEPT_UPDATE', `Updated department: ${name}`, req.ip);
    const [rows] = await pool.execute('SELECT * FROM departments WHERE id = ?', [req.params.id]);
    return sendSuccess(res, rows[0], 'Department updated successfully.');
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    const [check] = await pool.execute('SELECT id, name FROM departments WHERE id = ?', [req.params.id]);
    if (!check.length) return sendError(res, 'Department not found.', 404);

    const [staffCheck] = await pool.execute(
      "SELECT COUNT(*) as count FROM staff WHERE department_id = ? AND status = 'active'",
      [req.params.id]
    );
    if (staffCheck[0].count > 0) {
      return sendError(res, 'Cannot delete department with active staff members.', 409);
    }

    await pool.execute('DELETE FROM departments WHERE id = ?', [req.params.id]);
    await logActivity(req.user.id, 'DEPT_DELETE', `Deleted department: ${check[0].name}`, req.ip);
    return sendSuccess(res, null, 'Department deleted successfully.');
  } catch (error) { next(error); }
};

module.exports = { getAll, getById, create, update, remove };
