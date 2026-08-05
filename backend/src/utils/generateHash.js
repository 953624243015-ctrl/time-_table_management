/**
 * Run this script once to get the bcrypt hash for a password,
 * then paste it into database/schema.sql or directly update the DB.
 *
 * Usage:  node src/utils/generateHash.js
 */
const bcrypt = require('bcryptjs');

async function main() {
  const password = 'Admin@123';
  const hash = await bcrypt.hash(password, 12);
  console.log('\nPassword:', password);
  console.log('Hash    :', hash);
  console.log('\nSQL update:\n');
  console.log(`UPDATE users SET password = '${hash}' WHERE email = 'admin@college.edu';`);
}

main();
