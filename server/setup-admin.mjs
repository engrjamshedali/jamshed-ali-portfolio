import { db } from './db.mjs';
import { hashPassword } from './auth.mjs';

const username = process.argv[2] || 'admin';
const password = process.argv[3] || 'Admin@123456';
const email = process.argv[4] || 'engr.jamshed.ali.rind@gmail.com';

const hash = hashPassword(password);

const existing = db.prepare('SELECT id FROM admin_users WHERE username = ?').get(username);
if (existing) {
  db.prepare('UPDATE admin_users SET password_hash = ?, email = ? WHERE id = ?').run(hash, email, existing.id);
  console.log(`\nAdmin user '${username}' credentials updated successfully!`);
} else {
  db.prepare('INSERT INTO admin_users (username, email, password_hash) VALUES (?, ?, ?)').run(username, email, hash);
  console.log(`\nAdmin user '${username}' created successfully!`);
}

console.log(`Username: ${username}`);
console.log(`Password: ${password}`);
console.log(`Email:    ${email}`);
console.log(`Admin URL: http://localhost:3000/admin/login\n`);

