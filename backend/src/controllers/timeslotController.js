const { validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const { logActivity } = require('../utils/logger');

const getAll = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM time_slots ORDER BY period_number'
    );
    return sendSuccess(res, rows);
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM time_slots WHERE id = ?', [req.params.id]);
    if (!rows.length) return sendError(res, 'Time slot not found.', 404);
    return sendSuccess(res, rows[0]);
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, 'Validation failed', 400, errors.array());

    const { slot_name, start_time, end_time, period_number, is_break, break_type } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO time_slots (slot_name, start_time, end_time, period_number, is_break, break_type) VALUES (?, ?, ?, ?, ?, ?)',
      [slot_name, start_time, end_time, period_number, is_break || 0, break_type || null]
    );
    await logActivity(req.user.id, 'SLOT_CREATE', `Created time slot: ${slot_name}`, req.ip);
    const [rows] = await pool.execute('SELECT * FROM time_slots WHERE id = ?', [result.insertId]);
    return sendSuccess(res, rows[0], 'Time slot created successfully.', 201);
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, 'Validation failed', 400, errors.array());

    const { slot_name, start_time, end_time, period_number, is_break, break_type, is_active } = req.body;
    const [check] = await pool.execute('SELECT id FROM time_slots WHERE id = ?', [req.params.id]);
    if (!check.length) return sendError(res, 'Time slot not found.', 404);

    await pool.execute(
      'UPDATE time_slots SET slot_name=?, start_time=?, end_time=?, period_number=?, is_break=?, break_type=?, is_active=? WHERE id=?',
      [slot_name, start_time, end_time, period_number, is_break || 0, break_type || null, is_active ?? 1, req.params.id]
    );
    await logActivity(req.user.id, 'SLOT_UPDATE', `Updated time slot: ${slot_name}`, req.ip);
    const [rows] = await pool.execute('SELECT * FROM time_slots WHERE id = ?', [req.params.id]);
    return sendSuccess(res, rows[0], 'Time slot updated successfully.');
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    const [check] = await pool.execute('SELECT id, slot_name FROM time_slots WHERE id = ?', [req.params.id]);
    if (!check.length) return sendError(res, 'Time slot not found.', 404);

    const [[tt]] = await pool.execute('SELECT COUNT(*) as count FROM timetable WHERE time_slot_id = ?', [req.params.id]);
    if (tt.count > 0) return sendError(res, 'Cannot delete time slot used in timetable.', 409);

    await pool.execute('DELETE FROM time_slots WHERE id = ?', [req.params.id]);
    return sendSuccess(res, null, 'Time slot deleted successfully.');
  } catch (error) { next(error); }
};

const getAcademicSettings = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM academic_settings');
    const settings = {};
    rows.forEach(r => { settings[r.setting_key] = r.setting_value; });
    return sendSuccess(res, settings);
  } catch (error) { next(error); }
};

const updateAcademicSettings = async (req, res, next) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return sendError(res, 'Settings object is required.', 400);
    }
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const [key, value] of Object.entries(settings)) {
        await conn.execute(
          'INSERT INTO academic_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
          [key, String(value), String(value)]
        );
      }
      await conn.commit();
      await logActivity(req.user.id, 'SETTINGS_UPDATE', 'Updated academic settings', req.ip);
      return sendSuccess(res, null, 'Academic settings updated successfully.');
    } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
  } catch (error) { next(error); }
};

const getAcademicYears = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM academic_years ORDER BY year_label DESC');
    return sendSuccess(res, rows);
  } catch (error) { next(error); }
};

const getSemesters = async (req, res, next) => {
  try {
    const { academic_year_id } = req.query;
    let query = 'SELECT s.*, ay.year_label FROM semesters s LEFT JOIN academic_years ay ON s.academic_year_id = ay.id';
    const params = [];
    if (academic_year_id) { query += ' WHERE s.academic_year_id = ?'; params.push(academic_year_id); }
    query += ' ORDER BY s.academic_year_id DESC, s.start_date';
    const [rows] = await pool.execute(query, params);
    return sendSuccess(res, rows);
  } catch (error) { next(error); }
};

module.exports = { getAll, getById, create, update, remove, getAcademicSettings, updateAcademicSettings, getAcademicYears, getSemesters };
