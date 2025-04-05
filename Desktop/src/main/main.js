const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./database');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Load the index.html file
  const indexPath = path.join(__dirname, '../renderer/index.html');
  console.log('Loading index.html from:', indexPath);
  mainWindow.loadFile(indexPath);
  
  // Always open DevTools in development
  mainWindow.webContents.openDevTools();

  // Log any loading errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  db.initDatabase();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// School Handlers
ipcMain.on('get-school', (event) => {
  db.getSchool((err, school) => {
    if (err) {
      console.error('Error fetching school:', err);
      event.reply('school-info', { error: err.message });
      return;
    }
    event.reply('school-info', school);
  });
});

ipcMain.on('add-school', (event, data) => {
  db.addSchool(data.name, data.location, data.sessionStartMonth, (err, school) => {
    if (err) {
      console.error('Error adding school:', err);
      event.reply('school-added', { error: err.message });
      return;
    }
    event.reply('school-added', school);
  });
});

// Dashboard Handlers
ipcMain.on('get-dashboard-stats', (event) => {
  db.getDashboardStats((err, stats) => {
    event.reply('dashboard-stats', err ? { error: err.message } : stats);
  });
});

// Session Handlers
ipcMain.on('get-sessions', (event) => {
  db.getSessions((err, sessions) => {
    event.reply('sessions-list', err ? [] : sessions);
  });
});

ipcMain.on('add-session', (event, data) => {
  db.addSession(data.name, data.start_date, data.end_date, data.is_active, (err, result) => {
    event.reply('session-added', err ? { error: err.message } : result);
    if (!err) {
      // Refresh sessions list
      db.getSessions((err, sessions) => {
        event.reply('sessions-list', err ? [] : sessions);
      });
    }
  });
});

ipcMain.on('get-session', (event, id) => {
  db.getSession(id, (err, session) => {
    event.reply('session-details', err ? { error: err.message } : session);
  });
});

ipcMain.on('delete-session', (event, id) => {
  db.deleteSession(id, (err) => {
    if (err) {
      event.reply('session-deleted', { error: err.message });
    } else {
      event.reply('session-deleted', { success: true });
      // Refresh sessions list
      db.getSessions((err, sessions) => {
        event.reply('sessions-list', err ? [] : sessions);
      });
    }
  });
});

// Fee Type Handlers
ipcMain.on('get-fee-types', (event) => {
  db.getFeeTypes((err, feeTypes) => {
    event.reply('fee-types-list', err ? [] : feeTypes);
  });
});

ipcMain.on('add-fee-type', (event, data) => {
  db.addFeeType(data.name, data.amount, data.is_recurring, (err, result) => {
    event.reply('fee-type-added', err ? { error: err.message } : result);
    if (!err) {
      // Refresh fee types list
      db.getFeeTypes((err, feeTypes) => {
        event.reply('fee-types-list', err ? [] : feeTypes);
      });
    }
  });
});

ipcMain.on('update-fee-type', (event, data) => {
  db.updateFeeType(data.id, data.name, data.amount, data.is_recurring, (err) => {
    event.reply('fee-type-updated', err ? { error: err.message } : { success: true });
    if (!err) {
      // Refresh fee types list
      db.getFeeTypes((err, feeTypes) => {
        event.reply('fee-types-list', err ? [] : feeTypes);
      });
    }
  });
});

ipcMain.on('delete-fee-type', (event, id) => {
  db.deleteFeeType(id, (err) => {
    event.reply('fee-type-deleted', err ? { error: err.message } : { success: true });
    if (!err) {
      // Refresh fee types list
      db.getFeeTypes((err, feeTypes) => {
        event.reply('fee-types-list', err ? [] : feeTypes);
      });
    }
  });
});

// Route Handlers
ipcMain.on('get-routes', (event) => {
  db.getRoutes((err, routes) => {
    event.reply('routes-list', err ? [] : routes);
  });
});

ipcMain.on('add-route', (event, data) => {
  db.addRoute(data.name, data.distance_km, data.base_fee, (err, result) => {
    event.reply('route-added', err ? { error: err.message } : result);
    if (!err) {
      // Refresh routes list
      db.getRoutes((err, routes) => {
        event.reply('routes-list', err ? [] : routes);
      });
    }
  });
});

ipcMain.on('update-route', (event, data) => {
  db.updateRoute(data.id, data.name, data.distance_km, data.base_fee, (err) => {
    event.reply('route-updated', err ? { error: err.message } : { success: true });
    if (!err) {
      // Refresh routes list
      db.getRoutes((err, routes) => {
        event.reply('routes-list', err ? [] : routes);
      });
    }
  });
});

ipcMain.on('delete-route', (event, id) => {
  db.deleteRoute(id, (err) => {
    event.reply('route-deleted', err ? { error: err.message } : { success: true });
    if (!err) {
      // Refresh routes list
      db.getRoutes((err, routes) => {
        event.reply('routes-list', err ? [] : routes);
      });
    }
  });
});

// Student Handlers
ipcMain.on('get-students', (event) => {
  db.getStudents((err, students) => {
    event.reply('students-list', err ? [] : students);
  });
});

ipcMain.on('get-student', (event, id) => {
  db.getStudent(id, (err, student) => {
    event.reply('student-details', err ? { error: err.message } : student);
  });
});

ipcMain.on('add-student', (event, data) => {
  db.addStudent(data.name, data.admission_number, data.route_id, (err, result) => {
    event.reply('student-added', err ? { error: err.message } : result);
    if (!err) {
      // Refresh students list
      db.getStudents((err, students) => {
        event.reply('students-list', err ? [] : students);
      });
    }
  });
});

ipcMain.on('update-student', (event, data) => {
  db.updateStudent(data.id, data.name, data.admission_number, data.route_id, (err) => {
    event.reply('student-updated', err ? { error: err.message } : { success: true });
    if (!err) {
      // Refresh students list
      db.getStudents((err, students) => {
        event.reply('students-list', err ? [] : students);
      });
    }
  });
});

ipcMain.on('delete-student', (event, id) => {
  db.deleteStudent(id, (err) => {
    event.reply('student-deleted', err ? { error: err.message } : { success: true });
    if (!err) {
      // Refresh students list
      db.getStudents((err, students) => {
        event.reply('students-list', err ? [] : students);
      });
      
      // Update dashboard stats
      db.getDashboardStats((err, stats) => {
        event.reply('dashboard-stats', err ? { error: err.message } : stats);
      });
    }
  });
});

// Student Fees Handlers
ipcMain.on('get-student-fees', (event, studentId) => {
  db.getStudentFees(studentId, (err, fees) => {
    event.reply('student-fees-list', err ? [] : fees);
  });
});

ipcMain.on('add-student-fee', (event, data) => {
  db.addStudentFee(data.student_id, data.fee_type_id, data.amount, data.due_date, (err, result) => {
    event.reply('student-fee-added', err ? { error: err.message } : result);
    if (!err) {
      // Refresh student fees list
      db.getStudentFees(data.student_id, (err, fees) => {
        event.reply('student-fees-list', err ? [] : fees);
      });
      
      // Update dashboard stats
      db.getDashboardStats((err, stats) => {
        event.reply('dashboard-stats', err ? { error: err.message } : stats);
      });
    }
  });
});

ipcMain.on('update-fee-status', (event, data) => {
  db.updateFeeStatus(data.id, data.status, (err) => {
    event.reply('fee-status-updated', err ? { error: err.message } : { success: true });
    if (!err) {
      // Refresh student fees list
      db.getStudentFees(data.student_id, (err, fees) => {
        event.reply('student-fees-list', err ? [] : fees);
      });
      
      // Update dashboard stats
      db.getDashboardStats((err, stats) => {
        event.reply('dashboard-stats', err ? { error: err.message } : stats);
      });
    }
  });
});

ipcMain.on('delete-student-fee', (event, data) => {
  db.deleteStudentFee(data.id, (err) => {
    event.reply('student-fee-deleted', err ? { error: err.message } : { success: true });
    if (!err) {
      // Refresh student fees list
      db.getStudentFees(data.student_id, (err, fees) => {
        event.reply('student-fees-list', err ? [] : fees);
      });
      
      // Update dashboard stats
      db.getDashboardStats((err, stats) => {
        event.reply('dashboard-stats', err ? { error: err.message } : stats);
      });
    }
  });
}); 