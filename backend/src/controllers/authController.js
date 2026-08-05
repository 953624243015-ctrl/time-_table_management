const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const { logActivity } = require('../utils/logger');

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 400, errors.array());
    }

    const { email, password } = req.body;

    const [rows] = await pool.execute(
      'SELECT id, name, email, password, role, is_active FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (!rows.length) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    const user = rows[0];
    if (!user.is_active) {
      return sendError(res, 'Account is deactivated. Contact administrator.', 403);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    await pool.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
    await logActivity(user.id, 'LOGIN', `User ${user.email} logged in`, req.ip);

    return sendSuccess(res, {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, is_active, last_login, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows.length) return sendError(res, 'User not found.', 404);
    return sendSuccess(res, rows[0]);
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const [rows] = await pool.execute('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) return sendError(res, 'User not found.', 404);

    const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isMatch) return sendError(res, 'Current password is incorrect.', 400);

    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashed = await bcrypt.hash(newPassword, rounds);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    await logActivity(req.user.id, 'PASSWORD_CHANGE', 'Password changed successfully', req.ip);

    return sendSuccess(res, null, 'Password changed successfully.');
  } catch (error) {
    next(error);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const [[deptCount]] = await pool.execute('SELECT COUNT(*) as count FROM departments WHERE is_active = 1');
    const [[staffCount]] = await pool.execute("SELECT COUNT(*) as count FROM staff WHERE status = 'active'");
    const [[classCount]] = await pool.execute('SELECT COUNT(*) as count FROM classes');
    const [[subjectCount]] = await pool.execute('SELECT COUNT(*) as count FROM subjects');
    const [[roomCount]] = await pool.execute('SELECT COUNT(*) as count FROM rooms WHERE is_active = 1');
    const [[timetableCount]] = await pool.execute('SELECT COUNT(DISTINCT class_id) as count FROM timetable WHERE is_active = 1');

    const [recentLogs] = await pool.execute(
      `SELECT al.action, al.description, al.created_at, u.name as user_name
       FROM activity_logs al LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC LIMIT 10`
    );

    const [facultyWorkload] = await pool.execute(
      `SELECT s.name, COUNT(DISTINCT t.subject_id) as subjects,
       COUNT(t.id) as total_periods
       FROM staff s LEFT JOIN timetable t ON s.id = t.staff_id
       WHERE s.status = 'active'
       GROUP BY s.id, s.name ORDER BY total_periods DESC LIMIT 8`
    );

    const [deptStats] = await pool.execute(
      `SELECT d.name, d.code,
       COUNT(DISTINCT s.id) as staff_count,
       COUNT(DISTINCT c.id) as class_count,
       COUNT(DISTINCT sub.id) as subject_count
       FROM departments d
       LEFT JOIN staff s ON d.id = s.department_id AND s.status = 'active'
       LEFT JOIN classes c ON d.id = c.department_id
       LEFT JOIN subjects sub ON d.id = sub.department_id
       WHERE d.is_active = 1 GROUP BY d.id, d.name, d.code`
    );

    return sendSuccess(res, {
      stats: {
        departments: deptCount.count,
        staff: staffCount.count,
        classes: classCount.count,
        subjects: subjectCount.count,
        rooms: roomCount.count,
        generatedTimetables: timetableCount.count,
      },
      recentActivity: recentLogs,
      facultyWorkload,
      departmentStats: deptStats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, getMe, changePassword, getDashboardStats };
