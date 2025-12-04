const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../../jala.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  // Create users table if it doesn't exist
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Insert default admin user if not exists
  const defaultEmail = 'training@jalaacademy.com';
  const defaultPassword = require('bcryptjs').hashSync('jobprogram', 10);
  
  db.get('SELECT id FROM users WHERE email = ?', [defaultEmail], (err, row) => {
    if (!row) {
      db.run(
        'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
        [defaultEmail, defaultPassword, 'Admin User', 'admin'],
        (err) => {
          if (err) {
            console.error('Error creating default admin user:', err);
          } else {
            console.log('Default admin user created');
          }
        }
      );
    }
  });
}

module.exports = db;
