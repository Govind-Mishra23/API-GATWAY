const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/productRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ service: 'product-service', status: 'up' });
});

app.use('/products', productRoutes);

module.exports = app;
