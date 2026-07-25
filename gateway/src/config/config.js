require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 8000,
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_jwt_key_12345',
  services: {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:8001',
    user: process.env.USER_SERVICE_URL || 'http://localhost:8002',
    product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:8003'
  }
};
