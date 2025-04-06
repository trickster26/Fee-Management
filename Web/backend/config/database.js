const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',          // Replace with your MySQL username
  password: 'your_password', // Replace with your MySQL password
  database: 'school_fees_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection and initialize database
async function initDatabase() {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to MySQL');

    // Create database if not exists
    await connection.query('CREATE DATABASE IF NOT EXISTS school_fees_db');
    await connection.query('USE school_fees_db');

    // Create tables
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schools (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255)
      );
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT,
        name VARCHAR(100) NOT NULL,
        start_date DATE,
        end_date DATE,
        FOREIGN KEY (school_id) REFERENCES schools(id)
      );
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT,
        session_id INT,
        name VARCHAR(255) NOT NULL,
        class VARCHAR(50),
        roll_no VARCHAR(50),
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id),
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      );
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS fees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT,
        amount DECIMAL(10,2) NOT NULL,
        due_date DATE,
        paid_amount DECIMAL(10,2) DEFAULT 0,
        payment_date DATE,
        status VARCHAR(50) DEFAULT 'pending',
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id)
      );
    `);

    console.log('Database tables created');
    connection.release();
  } catch (err) {
    console.error('Error initializing database:', err.stack);
  }
}

module.exports = { pool, initDatabase };