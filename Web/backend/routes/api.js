const express = require('express');
const { pool } = require('../config/database');
const router = express.Router();

// --- Schools ---
router.get('/schools', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM schools');
    res.json(rows);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/schools', async (req, res) => {
  const { name, location } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try {
    const [result] = await pool.query(
      'INSERT INTO schools (name, location) VALUES (?, ?)',
      [name, location]
    );
    const [newSchool] = await pool.query('SELECT * FROM schools WHERE id = ?', [result.insertId]);
    res.status(201).json(newSchool[0]);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: 'Database error' });
  }
});

// --- Students ---
router.get('/students', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM students');
    res.json(rows);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/students', async (req, res) => {
  const { school_id, session_id, name, class: studentClass, roll_no } = req.body;
  if (!name || !school_id) return res.status(400).json({ error: 'Name and school_id are required' });
  try {
    const [result] = await pool.query(
      'INSERT INTO students (school_id, session_id, name, class, roll_no) VALUES (?, ?, ?, ?, ?)',
      [school_id, session_id, name, studentClass, roll_no]
    );
    const [newStudent] = await pool.query('SELECT * FROM students WHERE id = ?', [result.insertId]);
    res.status(201).json(newStudent[0]);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: 'Database error' });
  }
});

// --- Fees ---
router.get('/fees', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT f.*, s.name AS student_name 
      FROM fees f 
      JOIN students s ON f.student_id = s.id
    `);
    res.json(rows);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/fees', async (req, res) => {
  const { student_id, amount, due_date } = req.body;
  if (!student_id || !amount || !due_date) {
    return res.status(400).json({ error: 'student_id, amount, and due_date are required' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO fees (student_id, amount, due_date) VALUES (?, ?, ?)',
      [student_id, amount, due_date]
    );
    const [newFee] = await pool.query('SELECT * FROM fees WHERE id = ?', [result.insertId]);
    res.status(201).json(newFee[0]);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/fees/payment', async (req, res) => {
  const { fee_id, amount, payment_date } = req.body;
  if (!fee_id || !amount || !payment_date) {
    return res.status(400).json({ error: 'fee_id, amount, and payment_date are required' });
  }
  try {
    const [result] = await pool.query(
      'UPDATE fees SET paid_amount = paid_amount + ?, payment_date = ?, status = ? WHERE id = ?',
      [amount, payment_date, 'paid', fee_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Fee not found' });
    }
    const [updatedFee] = await pool.query('SELECT * FROM fees WHERE id = ?', [fee_id]);
    res.json(updatedFee[0]);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;