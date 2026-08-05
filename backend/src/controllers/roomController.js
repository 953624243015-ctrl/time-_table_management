const { validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { logActivity } = require('../utils/logger');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', room_type, building } = req.query;
    const offset = (page - 1) * limit;
    const searchParam = `%${search}%`;
    const params = [searchParam, searchParam, searchParam];
    let where = '(room_number LIKE ? OR building LIKE ? OR room_type LIKE ?)';
    if (room_type) { where += ' AND room_type = ?'; params.push(room_type); }
    if (building) { where += ' AND building LIKE ?'; params.push(`%${building}%`); }

    const [rows] = await pool.execute(
      `SELECT * FROM rooms WHERE ${where} ORDER BY building, room_number
       LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
      params
    );

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total FROM rooms WHERE ${where}`, params
    );

    return sendPaginated(res, rows, total, page, limit);
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM rooms WHERE id = ?', [req.params.id]);
    if (!rows.length) return sendError(res, 'Room not found.', 404);
    return sendSuccess(res, rows[0]);
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, 'Validation failed', 400, errors.array());

    const { room_number, room_type, capacity, building } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO rooms (room_number, room_type, capacity, building) VALUES (?, ?, ?, ?)',
      [room_number.trim(), room_type, capacity || 60, building?.trim() || null]
    );
    await logActivity(req.user.id, 'ROOM_CREATE', `Created room: ${room_number}`, req.ip);
    const [rows] = await pool.execute('SELECT * FROM rooms WHERE id = ?', [result.insertId]);
    return sendSuccess(res, rows[0], 'Room created successfully.', 201);
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, 'Validation failed', 400, errors.array());

    const { room_number, room_type, capacity, building, is_active } = req.body;
    const [check] = await pool.execute('SELECT id FROM rooms WHERE id = ?', [req.params.id]);
    if (!check.length) return sendError(res, 'Room not found.', 404);

    await pool.execute(
      'UPDATE rooms SET room_number=?, room_type=?, capacity=?, building=?, is_active=? WHERE id=?',
      [room_number.trim(), room_type, capacity || 60, building?.trim() || null, is_active ?? 1, req.params.id]
    );
    await logActivity(req.user.id, 'ROOM_UPDATE', `Updated room: ${room_number}`, req.ip);
    const [rows] = await pool.execute('SELECT * FROM rooms WHERE id = ?', [req.params.id]);
    return sendSuccess(res, rows[0], 'Room updated successfully.');
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    const [check] = await pool.execute('SELECT id, room_number FROM rooms WHERE id = ?', [req.params.id]);
    if (!check.length) return sendError(res, 'Room not found.', 404);
    await pool.execute('DELETE FROM rooms WHERE id = ?', [req.params.id]);
    await logActivity(req.user.id, 'ROOM_DELETE', `Deleted room: ${check[0].room_number}`, req.ip);
    return sendSuccess(res, null, 'Room deleted successfully.');
  } catch (error) { next(error); }
};

module.exports = { getAll, getById, create, update, remove };
