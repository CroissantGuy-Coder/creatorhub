require('dotenv').config();
const { initDb, dbProxy: db } = require('./db');

initDb().then(() => {
  const users = db.prepare('SELECT username, email, role FROM users').all();
  console.log('\nRegistered users:');
  users.forEach(u => console.log(`  username="${u.username}"  email=${u.email}  role=${u.role}`));
  process.exit(0);
});
