// One-time helper: adds the admin demo accounts to your existing local database.
// Safe to run multiple times (INSERT OR IGNORE). Run from the project root:
//   node add-admin.js
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'server', 'db', 'truehire.db');
const db = new Database(dbPath);

const hash = bcrypt.hashSync('password123', 10);
const admins = [
  'admin@switchera.com',
  'admin1@switchera.com',
  'admin2@switchera.com',
  'admin3@switchera.com',
  'admin4@switchera.com',
  'admin5@switchera.com',
];

const insert = db.prepare("INSERT OR IGNORE INTO users (email, password_hash, role) VALUES (?, ?, 'admin')");
let added = 0;
for (const email of admins) {
  const res = insert.run(email, hash);
  if (res.changes) added++;
}
try {
  db.prepare("UPDATE users SET is_super_admin = 1 WHERE email = 'admin@switchera.com'").run();
} catch (e) { /* is_super_admin column may not exist on very old DBs; ignore */ }

const total = db.prepare("SELECT COUNT(*) AS c FROM users").get().c;
const adminCount = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'admin'").get().c;
console.log(`Added ${added} new admin account(s). Admins now: ${adminCount}. Total users: ${total}.`);
console.log("Log in with:  admin@switchera.com  /  password123");
db.close();
