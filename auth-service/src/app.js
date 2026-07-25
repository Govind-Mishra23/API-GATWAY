const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ service: 'auth-service', status: 'up' });
});

app.use('/auth', authRoutes);

module.exports = app;
