// const express = require('express');
// const { initDatabase } = require('./config/database');
// const apiRoutes = require('./routes/api');

// const app = express();
// const PORT = 3000;

// app.use(express.json()); // Parse JSON bodies

// // Initialize database
// initDatabase();

// // Routes
// app.use('/api', apiRoutes);

// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });

// backend/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/auth');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});