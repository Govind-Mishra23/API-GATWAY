const { createProxyMiddleware, responseInterceptor } = require('http-proxy-middleware');
const config = require('../config/config');
const redisClient = require('../cache/redis');

const invalidateProductCache = async () => {
  try {
    if (redisClient.isOpen) {
      const keysToDelete = [];
      for await (const key of redisClient.scanIterator({ MATCH: 'cache:/products*', COUNT: 100 })) {
        keysToDelete.push(key);
      }
      if (keysToDelete.length > 0) {
        await redisClient.del(keysToDelete);
        console.log(`Product cache invalidated successfully, deleted ${keysToDelete.length} keys`);
      }
    }
  } catch (err) {
    console.error('Failed to invalidate Redis product cache:', err.message);
  }
};

// Proxy to Auth Service
const authProxy = createProxyMiddleware({
  target: config.services.auth,
  changeOrigin: true,
});

// Proxy to User Service
const userProxy = createProxyMiddleware({
  target: config.services.user,
  changeOrigin: true,
});

// Proxy for Reading Products (GET requests, caches response)
const productReadProxy = createProxyMiddleware({
  target: config.services.product,
  changeOrigin: true,
  selfHandleResponse: true, // required for responseInterceptor to process the body
  onProxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
    const responseBody = responseBuffer.toString('utf8');

    if (proxyRes.statusCode === 200 && req.cacheKey) {
      try {
        if (redisClient.isOpen) {
          await redisClient.set(req.cacheKey, responseBody, { EX: 300 }); // Cache for 5 minutes
        }
      } catch (err) {
        console.error('[Proxy] Failed to write to Redis cache:', err);
      }
    }

    return responseBody;
  }),
});

// Proxy for Writing/Modifying Products (POST, PUT, DELETE, invalidates cache)
const productWriteProxy = createProxyMiddleware({
  target: config.services.product,
  changeOrigin: true,
  onProxyRes: (proxyRes, req, res) => {
    if (proxyRes.statusCode >= 200 && proxyRes.statusCode < 300) {
      invalidateProductCache();
    }
  },
});

module.exports = {
  authProxy,
  userProxy,
  productReadProxy,
  productWriteProxy,
};
