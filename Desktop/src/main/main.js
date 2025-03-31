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

// IPC Handlers
ipcMain.on('add-school', (event, data) => {
  db.addSchool(data.name, data.location, data.sessionStartMonth, (err, result) => {
    event.reply('school-added', err ? { error: err.message } : result);
  });
});
ipcMain.on('get-school', (event) => {
  db.getSchool((err, school) => {
    event.reply('school-info', err ? { error: err.message } : school);
  });
});

ipcMain.on('get-dashboard-stats', (event) => {
  db.getDashboardStats((err, stats) => {
    event.reply('dashboard-stats', err ? { error: err.message } : stats);
  });
});

// Enhanced session handlers
ipcMain.on('add-session', (event, data) => {
  if (data.is_active) {
    // First deactivate all sessions
    db.run('UPDATE sessions SET is_active = 0', [], (err) => {
      if (err) {
        event.reply('session-added', { error: err.message });
        return;
      }
      // Then add the new active session
      addSession();
    });
  } else {
    addSession();
  }

  function addSession() {
    db.addSession(data.name, data.start_date, data.end_date, data.is_active, (err, result) => {
      event.reply('session-added', err ? { error: err.message } : result);
    });
  }
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