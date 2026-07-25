const jwt = require('jsonwebtoken');
const config = require('../config/config');

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // Inject headers for downstream microservices
    req.headers['x-user-id'] = decoded.id;
    req.headers['x-user-role'] = decoded.role || 'user';
    req.headers['x-user-email'] = decoded.email || '';

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token', error: error.message });
  }
};
