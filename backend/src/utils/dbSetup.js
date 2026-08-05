/**
 * Run after importing schema.sql to fix the admin password hash.
 * Usage: node src/utils/dbSetup.js
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

async function fixAdminPassword() {
  const password = 'Admin@123';
  const hash = await bcrypt.hash(password, 12);
  await pool.execute(
    "UPDATE users SET password = ? WHERE email = 'admin@college.edu'",
    [hash]
  );
  console.log('✅ Admin password set to Admin@123');
  console.log('   Email: admin@college.edu');
  console.log('   Password: Admin@123');
  process.exit(0);
}

fixAdminPassword().catch(err => {
  console.error('❌ Setup failed:', err.message);
  process.exit(1);
});
