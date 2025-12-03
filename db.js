const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, 'jala.db');

const db = new sqlite3.Database(DB_PATH);

// Initialize tables needed for business logic demos
db.serialize(() => {
  // Simple employees table used for CRUD/API demo
  db.run(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      department TEXT,
      salary REAL,
      status TEXT DEFAULT 'Active'
    )
  `);

  // Detailed employee profile table for Employee → Create page
  db.run(`
    CREATE TABLE IF NOT EXISTS employee_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT,
      email TEXT NOT NULL,
      mobile TEXT,
      dob TEXT,
      gender TEXT,
      address TEXT,
      country TEXT,
      city TEXT,
      other_city TEXT,
      skills TEXT
    )
  `);
});

module.exports = db;


