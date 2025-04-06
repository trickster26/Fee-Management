/**
 * Database test utility
 * Run this script to verify database connection and schema
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure db directory exists
const dbDir = path.join(__dirname, '../../db');
if (!fs.existsSync(dbDir)) {
  console.log(`Creating db directory at ${dbDir}`);
  fs.mkdirSync(dbDir, { recursive: true });
}

// Connect to database
const dbPath = path.join(dbDir, 'fees.db');
console.log(`Testing database connection at: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    process.exit(1);
  }
  
  console.log('Successfully connected to SQLite database');
  
  // Test schema creation
  console.log('Testing schema creation...');
  createTestSchema();
});

// Create sample schema to test db functionality
function createTestSchema() {
  db.run(`CREATE TABLE IF NOT EXISTS test_table (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    value TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating test table:', err);
      closeAndExit(1);
      return;
    }
    
    console.log('Test table created successfully');
    insertTestRecord();
  });
}

// Insert a test record
function insertTestRecord() {
  const timestamp = new Date().toISOString();
  db.run(`INSERT INTO test_table (name, value) VALUES (?, ?)`, 
    ['test_record', `Test value created at ${timestamp}`], 
    function(err) {
      if (err) {
        console.error('Error inserting test record:', err);
        closeAndExit(1);
        return;
      }
      
      console.log(`Test record inserted with ID: ${this.lastID}`);
      queryTestRecord(this.lastID);
    }
  );
}

// Query the test record
function queryTestRecord(id) {
  db.get(`SELECT * FROM test_table WHERE id = ?`, [id], (err, row) => {
    if (err) {
      console.error('Error querying test record:', err);
      closeAndExit(1);
      return;
    }
    
    if (row) {
      console.log('Retrieved test record:');
      console.log(row);
      console.log('Database test completed successfully');
    } else {
      console.error('Test record not found');
    }
    
    // Clean up test data
    cleanupTestData();
  });
}

// Clean up test data
function cleanupTestData() {
  db.run(`DROP TABLE IF EXISTS test_table`, (err) => {
    if (err) {
      console.error('Error cleaning up test data:', err);
    } else {
      console.log('Test table removed successfully');
    }
    
    closeAndExit(0);
  });
}

// Close database and exit
function closeAndExit(code) {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
      process.exit(1);
    }
    
    console.log('Database connection closed');
    process.exit(code);
  });
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('Process interrupted');
  closeAndExit(0);
}); 