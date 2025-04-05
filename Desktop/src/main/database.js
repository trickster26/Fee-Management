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

function getSchool(callback) {
  db.get('SELECT * FROM school WHERE id = 1', (err, school) => {
    if (err) {
      console.error('Error fetching school:', err);
      callback(err);
      return;
    }

    if (school) {
      // School exists, check for session updates
      checkAndUpdateSession(school.session_start_month, school.last_session_update);
      callback(null, school);
    } else {
      // No school exists
      callback(null, null);
    }
  });
}

// Add session functions
function getSessions(callback) {
  db.all('SELECT * FROM sessions ORDER BY start_date DESC', callback);
}

function addSession(name, startDate, endDate, isActive, callback) {
  // If setting as active, first deactivate all sessions
  if (isActive) {
    db.run('UPDATE sessions SET is_active = 0', [], (err) => {
      if (err) {
        callback(err);
        return;
      }
      insertSession();
    });
  } else {
    insertSession();
  }

  function insertSession() {
    db.run(
      'INSERT INTO sessions (name, start_date, end_date, is_active) VALUES (?, ?, ?, ?)',
      [name, startDate, endDate, isActive ? 1 : 0],
      function(err) {
        if (err) {
          callback(err);
          return;
        }
        callback(null, {
          id: this.lastID,
          name,
          start_date: startDate,
          end_date: endDate,
          is_active: isActive
        });
      }
    );
  }
}

// Fee type functions
function getFeeTypes(callback) {
  db.all('SELECT * FROM fee_types ORDER BY name', callback);
}

function addFeeType(name, amount, isRecurring, callback) {
  db.run(
    'INSERT INTO fee_types (name, amount, is_recurring) VALUES (?, ?, ?)',
    [name, amount, isRecurring ? 1 : 0],
    function(err) {
      if (err) {
        callback(err);
        return;
      }
      callback(null, {
        id: this.lastID,
        name,
        amount,
        is_recurring: isRecurring
      });
    }
  );
}

function updateFeeType(id, name, amount, isRecurring, callback) {
  db.run(
    'UPDATE fee_types SET name = ?, amount = ?, is_recurring = ? WHERE id = ?',
    [name, amount, isRecurring ? 1 : 0, id],
    function(err) {
      callback(err ? err : null);
    }
  );
}

function deleteFeeType(id, callback) {
  // First check if this fee type is being used by any student
  db.get('SELECT COUNT(*) as count FROM student_fees WHERE fee_type_id = ?', [id], (err, result) => {
    if (err) {
      callback(err);
      return;
    }
    
    if (result.count > 0) {
      callback(new Error(`Cannot delete: This fee type is assigned to ${result.count} student(s)`));
      return;
    }
    
    // Safe to delete
    db.run('DELETE FROM fee_types WHERE id = ?', [id], function(err) {
      callback(err);
    });
  });
}

// Routes functions
function getRoutes(callback) {
  db.all('SELECT * FROM routes ORDER BY name', callback);
}

function addRoute(name, distanceKm, baseFee, callback) {
  db.run(
    'INSERT INTO routes (name, distance_km, base_fee) VALUES (?, ?, ?)',
    [name, distanceKm, baseFee],
    function(err) {
      if (err) {
        callback(err);
        return;
      }
      callback(null, {
        id: this.lastID,
        name,
        distance_km: distanceKm,
        base_fee: baseFee
      });
    }
  );
}

function updateRoute(id, name, distanceKm, baseFee, callback) {
  db.run(
    'UPDATE routes SET name = ?, distance_km = ?, base_fee = ? WHERE id = ?',
    [name, distanceKm, baseFee, id],
    function(err) {
      callback(err ? err : null);
    }
  );
}

function deleteRoute(id, callback) {
  // Check if any students are using this route
  db.get('SELECT COUNT(*) as count FROM students WHERE route_id = ?', [id], (err, result) => {
    if (err) {
      callback(err);
      return;
    }
    
    if (result.count > 0) {
      callback(new Error(`Cannot delete: This route is assigned to ${result.count} student(s)`));
      return;
    }
    
    // Safe to delete
    db.run('DELETE FROM routes WHERE id = ?', [id], function(err) {
      callback(err);
    });
  });
}

// Student functions
function getStudents(callback) {
  db.all(`
    SELECT s.*, r.name as route_name 
    FROM students s
    LEFT JOIN routes r ON s.route_id = r.id
    ORDER BY s.name
  `, callback);
}

function getStudent(id, callback) {
  db.get(`
    SELECT s.*, r.name as route_name 
    FROM students s
    LEFT JOIN routes r ON s.route_id = r.id
    WHERE s.id = ?
  `, [id], callback);
}

function addStudent(name, admissionNumber, routeId, callback) {
  db.run(
    'INSERT INTO students (name, admission_number, route_id) VALUES (?, ?, ?)',
    [name, admissionNumber, routeId || null],
    function(err) {
      if (err) {
        // Check for duplicate admission number
        if (err.message.includes('UNIQUE constraint failed')) {
          callback(new Error('A student with this admission number already exists'));
          return;
        }
        callback(err);
        return;
      }
      
      callback(null, {
        id: this.lastID,
        name,
        admission_number: admissionNumber,
        route_id: routeId
      });
    }
  );
}

function updateStudent(id, name, admissionNumber, routeId, callback) {
  db.run(
    'UPDATE students SET name = ?, admission_number = ?, route_id = ? WHERE id = ?',
    [name, admissionNumber, routeId || null, id],
    function(err) {
      if (err) {
        // Check for duplicate admission number
        if (err.message.includes('UNIQUE constraint failed')) {
          callback(new Error('A student with this admission number already exists'));
          return;
        }
        callback(err);
        return;
      }
      callback(null);
    }
  );
}

function deleteStudent(id, callback) {
  // First delete all associated fees
  db.run('DELETE FROM student_fees WHERE student_id = ?', [id], (err) => {
    if (err) {
      callback(err);
      return;
    }
    
    // Then delete the student
    db.run('DELETE FROM students WHERE id = ?', [id], function(err) {
      callback(err);
    });
  });
}

// Student fees functions
function getStudentFees(studentId, callback) {
  db.all(`
    SELECT sf.*, ft.name as fee_name
    FROM student_fees sf
    JOIN fee_types ft ON sf.fee_type_id = ft.id
    WHERE sf.student_id = ?
    ORDER BY sf.due_date
  `, [studentId], callback);
}

function addStudentFee(studentId, feeTypeId, amount, dueDate, callback) {
  db.run(
    'INSERT INTO student_fees (student_id, fee_type_id, amount, due_date) VALUES (?, ?, ?, ?)',
    [studentId, feeTypeId, amount, dueDate],
    function(err) {
      if (err) {
        callback(err);
        return;
      }
      callback(null, {
        id: this.lastID,
        student_id: studentId,
        fee_type_id: feeTypeId,
        amount,
        due_date: dueDate,
        status: 'pending'
      });
    }
  );
}

function updateFeeStatus(id, status, callback) {
  db.run(
    'UPDATE student_fees SET status = ? WHERE id = ?',
    [status, id],
    function(err) {
      callback(err ? err : null);
    }
  );
}

function deleteStudentFee(id, callback) {
  db.run('DELETE FROM student_fees WHERE id = ?', [id], function(err) {
    callback(err);
  });
}

module.exports = {
  initDatabase,
  getSchool,
  addSchool,
  getSessions,
  getSession,
  addSession,
  deleteSession,
  getFeeTypes,
  addFeeType,
  updateFeeType,
  deleteFeeType,
  getRoutes,
  addRoute,
  updateRoute,
  deleteRoute,
  getStudents,
  getStudent,
  addStudent,
  updateStudent,
  deleteStudent,
  getStudentFees,
  addStudentFee,
  updateFeeStatus,
  deleteStudentFee,
  getDashboardStats
}; 