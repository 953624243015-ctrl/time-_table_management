const { pool } = require('../config/database');

const logActivity = async (userId, action, description, ipAddress = null) => {
  try {
    await pool.execute(
      'INSERT INTO activity_logs (user_id, action, description, ip_address) VALUES (?, ?, ?, ?)',
      [userId || null, action, description, ipAddress]
    );
  } catch (error) {
    console.error('Failed to log activity:', error.message);
  }
};

module.exports = { logActivity };
