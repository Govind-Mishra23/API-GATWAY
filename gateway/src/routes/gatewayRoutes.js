const express = require('express');
const router = express.Router();
const { authProxy, userProxy, productReadProxy, productWriteProxy } = require('../proxy/proxy');
const authMiddleware = require('../middleware/auth');
const cacheMiddleware = require('../middleware/cache');

// 1. Auth Service Routes (Public)
router.use('/auth', authProxy);

// 2. User Service Routes (Protected)
router.use('/users', authMiddleware, userProxy);

// 3. Product Service Routes
// GET requests are public and can be cached
router.get('/products', cacheMiddleware, productReadProxy);
router.get('/products/:id', cacheMiddleware, productReadProxy);

// Other methods (POST, PUT, DELETE) require JWT authentication and clear cache on success
router.post('/products', authMiddleware, productWriteProxy);
router.put('/products/:id', authMiddleware, productWriteProxy);
router.delete('/products/:id', authMiddleware, productWriteProxy);

module.exports = router;
