/**
 * Run this script to promote a user to admin:
 *   node src/make-admin.js YourUsername
 */

require('dotenv').config();
const { initDb, dbProxy: db } = require('./db');

const username = process.argv[2];

if (!username) {
  console.error('Usage: node src/make-admin.js <username>');
  process.exit(1);
}

initDb().then(() => {
  const user = db.prepare('SELECT id, username, role FROM users WHERE username = ?').get(username);

  if (!user) {
    console.error(`User "${username}" not found. Make sure you have registered first.`);
    process.exit(1);
  }

  if (user.role === 'admin') {
    console.log(`"${username}" is already an admin.`);
    process.exit(0);
  }

  db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(user.id);
  console.log(`Success! "${username}" has been promoted to admin.`);
  console.log('Log out and back in at http://localhost:5173 to see the Admin Panel.');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
