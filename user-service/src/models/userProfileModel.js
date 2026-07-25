const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    default: '',
  },
  address: {
    type: String,
    default: '',
  },
  orders: {
    type: [String],
    default: [],
  }
}, { timestamps: true });

module.exports = mongoose.model('UserProfile', userProfileSchema);
