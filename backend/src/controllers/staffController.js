const { validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { logActivity } = require('../utils/logger');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', department_id, status, sort = 's.name', order = 'ASC' } = req.query;
    const offset = (page - 1) * limit;
    const searchParam = `%${search}%`;
    const params = [searchParam, searchParam, searchParam, searchParam];
    let where = '(s.name LIKE ? OR s.staff_id LIKE ? OR s.email LIKE ? OR s.designation LIKE ?)';
    if (department_id) { where += ' AND s.department_id = ?'; params.push(department_id); }
    if (status) { where += ' AND s.status = ?'; params.push(status); }

    const [rows] = await pool.execute(
      `SELECT s.*, d.name as department_name, d.code as department_code,
        (SELECT COUNT(*) FROM timetable WHERE staff_id = s.id AND is_active = 1) as current_periods,
        GROUP_CONCAT(DISTINCT sa.day_of_week ORDER BY FIELD(sa.day_of_week,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday')) as available_days
       FROM staff s
       LEFT JOIN departments d ON s.department_id = d.id
       LEFT JOIN staff_availability sa ON s.id = sa.staff_id AND sa.is_available = 1
       WHERE ${where}
       GROUP BY s.id ORDER BY ${sort} ${order === 'DESC' ? 'DESC' : 'ASC'}
       LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
      params
    );

    const countParams = [...params];
    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total FROM staff s WHERE ${where}`, countParams
    );

    return sendPaginated(res, rows, total, page, limit);
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT s.*, d.name as department_name, d.code as department_code
       FROM staff s LEFT JOIN departments d ON s.department_id = d.id WHERE s.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return sendError(res, 'Staff not found.', 404);

    const [availability] = await pool.execute(
      'SELECT day_of_week, is_available FROM staff_availability WHERE staff_id = ?',
      [req.params.id]
    );
    const [subjects] = await pool.execute(
      `SELECT sf.*, sub.subject_name, sub.subject_code, sub.subject_type,
        c.year, c.semester, c.section, d.name as dept_name
       FROM subject_faculty sf
       JOIN subjects sub ON sf.subject_id = sub.id
       LEFT JOIN classes c ON sf.class_id = c.id
       LEFT JOIN departments d ON sub.department_id = d.id
       WHERE sf.staff_id = ?`,
      [req.params.id]
    );

    return sendSuccess(res, { ...rows[0], availability, subjects });
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, 'Validation failed', 400, errors.array());

    const { staff_id, name, department_id, designation, email, phone, max_hours_per_week, status, availability } = req.body;
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [result] = await conn.execute(
        'INSERT INTO staff (staff_id, name, department_id, designation, email, phone, max_hours_per_week, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [staff_id, name, department_id, designation || null, email || null, phone || null, max_hours_per_week || 20, status || 'active']
      );
      const newStaffId = result.insertId;
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      for (const day of days) {
        const avail = availability ? (availability[day] !== undefined ? availability[day] : 1) : 1;
        await conn.execute(
          'INSERT INTO staff_availability (staff_id, day_of_week, is_available) VALUES (?, ?, ?)',
          [newStaffId, day, avail]
        );
      }
      await conn.commit();
      await logActivity(req.user.id, 'STAFF_CREATE', `Created staff: ${name}`, req.ip);
      const [rows] = await pool.execute(
        'SELECT s.*, d.name as department_name FROM staff s LEFT JOIN departments d ON s.department_id = d.id WHERE s.id = ?',
        [newStaffId]
      );
      return sendSuccess(res, rows[0], 'Staff created successfully.', 201);
    } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, 'Validation failed', 400, errors.array());

    const { name, department_id, designation, email, phone, max_hours_per_week, status, availability } = req.body;
    const [check] = await pool.execute('SELECT id FROM staff WHERE id = ?', [req.params.id]);
    if (!check.length) return sendError(res, 'Staff not found.', 404);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute(
        'UPDATE staff SET name=?, department_id=?, designation=?, email=?, phone=?, max_hours_per_week=?, status=? WHERE id=?',
        [name, department_id, designation || null, email || null, phone || null, max_hours_per_week || 20, status || 'active', req.params.id]
      );
      if (availability) {
        for (const [day, avail] of Object.entries(availability)) {
          await conn.execute(
            'INSERT INTO staff_availability (staff_id, day_of_week, is_available) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE is_available = ?',
            [req.params.id, day, avail, avail]
          );
        }
      }
      await conn.commit();
      await logActivity(req.user.id, 'STAFF_UPDATE', `Updated staff: ${name}`, req.ip);
      const [rows] = await pool.execute(
        'SELECT s.*, d.name as department_name FROM staff s LEFT JOIN departments d ON s.department_id = d.id WHERE s.id = ?',
        [req.params.id]
      );
      return sendSuccess(res, rows[0], 'Staff updated successfully.');
    } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    const [check] = await pool.execute('SELECT id, name FROM staff WHERE id = ?', [req.params.id]);
    if (!check.length) return sendError(res, 'Staff not found.', 404);
    await pool.execute('DELETE FROM staff WHERE id = ?', [req.params.id]);
    await logActivity(req.user.id, 'STAFF_DELETE', `Deleted staff: ${check[0].name}`, req.ip);
    return sendSuccess(res, null, 'Staff deleted successfully.');
  } catch (error) { next(error); }
};

module.exports = { getAll, getById, create, update, remove };
