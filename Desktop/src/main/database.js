const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { ipcMain } = require('electron');

let db;

function initDatabase() {
  const dbPath = path.join(__dirname, '../../db/fees.db');
  console.log('Database path:', dbPath);
  
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err);
      return;
    }
    console.log('Connected to SQLite database');
    createTables();
  });
}

function createTables() {
  // School table (single row)
  db.run(`CREATE TABLE IF NOT EXISTS school (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    session_start_month INTEGER NOT NULL,
    web_token TEXT UNIQUE,
    last_session_update DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Sessions table
  db.run(`CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Routes table
  db.run(`CREATE TABLE IF NOT EXISTS routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    distance_km REAL NOT NULL,
    base_fee REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Fee types table
  db.run(`CREATE TABLE IF NOT EXISTS fee_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    is_recurring BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Students table
  db.run(`CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    admission_number TEXT UNIQUE NOT NULL,
    route_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (route_id) REFERENCES routes(id)
  )`);

  // Student fees table
  db.run(`CREATE TABLE IF NOT EXISTS student_fees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    fee_type_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    due_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (fee_type_id) REFERENCES fee_types(id)
  )`);
}

// School functions
function addSchool(name, location, sessionStartMonth, callback) {
  const webToken = generateWebToken();
  
  db.run(
    'INSERT INTO school (id, name, location, session_start_month, web_token) VALUES (1, ?, ?, ?, ?)',
    [name, location, sessionStartMonth, webToken],
    function(err) {
      if (err) {
        callback(err);
        return;
      }
      // Create initial session after adding school
      createInitialSession(sessionStartMonth, (sessionErr) => {
        if (sessionErr) {
          callback(sessionErr);
          return;
        }
        callback(null, {
          id: this.lastID,
          name,
          location,
          sessionStartMonth,
          webToken
        });
      });
    }
  );
}


function getSchool(callback) {
  console.log('Checking for school in database...');
  db.get('SELECT * FROM school WHERE id = 1', (err, school) => {
    if (err) {
      console.error('Database error:', err);
      callback(err);
      return;
    }
    
    console.log('School data:', school);
    
    if (school) {
      // If school exists, check for session updates
      checkAndUpdateSession(school.session_start_month, school.last_session_update);
    }
    
    callback(null, school);
  });
}


// Dashboard stats
function getDashboardStats(callback) {
  const stats = {};
  
  // Get active sessions count
  db.get('SELECT COUNT(*) as count FROM sessions WHERE is_active = 1', (err, row) => {
    if (err) {
      callback(err);
      return;
    }
    stats.activeSessions = row.count;
    
    // Get total students count
    db.get('SELECT COUNT(*) as count FROM students', (err, row) => {
      if (err) {
        callback(err);
        return;
      }
      stats.totalStudents = row.count;
      
      // Get pending fees count
      db.get('SELECT COUNT(*) as count FROM student_fees WHERE status = "pending"', (err, row) => {
        if (err) {
          callback(err);
          return;
        }
        stats.pendingFees = row.count;
        
        callback(null, stats);
      });
    });
  });
}

// Enhanced session functions
function getSession(id, callback) {
  db.get('SELECT * FROM sessions WHERE id = ?', [id], callback);
}

function deleteSession(id, callback) {
  db.run('DELETE FROM sessions WHERE id = ?', [id], function(err) {
    callback(err);
  });
}

// Add new helper functions
function createInitialSession(startMonth, callback) {
  const now = new Date();
  const year = now.getFullYear();
  const sessionStart = new Date(year, startMonth - 1, 1);
  const sessionEnd = new Date(year + 1, startMonth - 1, 0);

  if (now < sessionStart) {
    sessionStart.setFullYear(year - 1);
    sessionEnd.setFullYear(year);
  }

  db.run(
    'INSERT INTO sessions (name, start_date, end_date, is_active) VALUES (?, ?, ?, 1)',
    [
      `${sessionStart.getFullYear()}-${sessionEnd.getFullYear()}`,
      sessionStart.toISOString().split('T')[0],
      sessionEnd.toISOString().split('T')[0]
    ],
    callback
  );
}

function generateWebToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const tokenLength = 32;
  let token = '';
  for (let i = 0; i < tokenLength; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function checkAndUpdateSession(startMonth, lastUpdate) {
  const now = new Date();
  const lastUpdateDate = lastUpdate ? new Date(lastUpdate) : null;
  
  if (!lastUpdateDate || 
      now.getMonth() + 1 === startMonth && 
      (!lastUpdateDate || now.getFullYear() > lastUpdateDate.getFullYear())) {
    
    // Create new session
    const sessionStart = new Date(now.getFullYear(), startMonth - 1, 1);
    const sessionEnd = new Date(now.getFullYear() + 1, startMonth - 1, 0);
    
    // First deactivate current session
    db.run('UPDATE sessions SET is_active = 0', [], (err) => {
      if (err) {
        console.error('Error deactivating current session:', err);
        return;
      }
      
      // Create new session
      db.run(
        'INSERT INTO sessions (name, start_date, end_date, is_active) VALUES (?, ?, ?, 1)',
        [
          `${sessionStart.getFullYear()}-${sessionEnd.getFullYear()}`,
          sessionStart.toISOString().split('T')[0],
          sessionEnd.toISOString().split('T')[0]
        ],
        (err) => {
          if (err) {
            console.error('Error creating new session:', err);
            return;
          }
          
          // Update last_session_update in school table
          db.run(
            'UPDATE school SET last_session_update = ? WHERE id = 1',
            [now.toISOString()]
          );
        }
      );
    });
  }
}

// Update the get-school handler
ipcMain.on('get-school', (event) => {
  db.getSchool((err, school) => {
    console.log('IPC: Checking for school');
    if (err) {
      console.error('Error fetching school:', err);
      event.reply('school-info', { error: err.message });
      return;
    }
    console.log('School fetched:', school);
    event.reply('school-info', school);
  });
});

module.exports = {
  initDatabase,
  addSchool,
  getSchool,
  getDashboardStats,
  getSession,
  deleteSession,
  createInitialSession,
  generateWebToken
}; 