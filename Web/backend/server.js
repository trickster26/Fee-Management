const express = require('express');
const { initDatabase } = require('./config/database');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = 3000;

app.use(express.json()); // Parse JSON bodies

// Initialize database
initDatabase();

// Routes
app.use('/api', apiRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});