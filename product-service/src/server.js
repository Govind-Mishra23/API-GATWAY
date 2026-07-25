require('dotenv').config();
const app = require('./app');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 8003;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/product_db';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Product Service connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Product Service running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database connection failed', err);
    process.exit(1);
  });
