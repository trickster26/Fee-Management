// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const db = require('../config/db');

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Signup with email/password
router.post('/signup', async (req, res) => {
  const { fullName, email, password, grade } = req.body;

  try {
    // Check if user already exists
    const [existingUser] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into database
    await db.promise().query(
      'INSERT INTO users (fullName, email, password, grade) VALUES (?, ?, ?, ?)',
      [fullName, email, hashedPassword, grade]
    );

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login with email/password
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const [user] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    if (user.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user[0].password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign({ id: user[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user[0].id, fullName: user[0].fullName, email: user[0].email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Google Signup/Login
router.post('/google', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'No token provided' });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    const [user] = await db.promise().query('SELECT * FROM users WHERE googleId = ? OR email = ?', [googleId, email]);
    
    if (user.length > 0) {
      const jwtToken = jwt.sign({ id: user[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' }); // Renamed to jwtToken
      return res.json({ token: jwtToken, user: { id: user[0].id, fullName: user[0].fullName, email: user[0].email } });
    }

    await db.promise().query(
      'INSERT INTO users (fullName, email, googleId) VALUES (?, ?, ?)',
      [name, email, googleId]
    );

    const [newUser] = await db.promise().query('SELECT * FROM users WHERE googleId = ?', [googleId]);
    const jwtToken = jwt.sign({ id: newUser[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' }); // Renamed to jwtToken
    res.status(201).json({ token: jwtToken, user: { id: newUser[0].id, fullName: newUser[0].fullName, email: newUser[0].email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify JWT token
router.get('/verify', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract Bearer token

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [user] = await db.promise().query('SELECT id, fullName, email FROM users WHERE id = ?', [decoded.id]);
    
    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: user[0] });
  } catch (error) {
    console.error(error);
    res.status(403).json({ message: 'Invalid or expired token' });
  }
});

module.exports = router;