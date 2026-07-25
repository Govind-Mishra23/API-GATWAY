const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ service: 'user-service', status: 'up' });
});

app.use('/users', userRoutes);

module.exports = app;
