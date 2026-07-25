require('dotenv').config();
const app = require('./app');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 8002;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/user_db';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('User Service connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`User Service running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database connection failed', err);
    process.exit(1);
  });
