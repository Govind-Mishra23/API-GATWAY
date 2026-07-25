const redisClient = require('../cache/redis');
const { cacheHitsTotal, cacheMissesTotal } = require('../metrics/prometheus');

module.exports = async (req, res, next) => {
  if (req.method !== 'GET') {
    return next();
  }

  const cacheKey = `cache:${req.originalUrl}`;

  try {
    // Check if redisClient is ready
    if (!redisClient.isOpen) {
      return next();
    }

    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      cacheHitsTotal.inc();
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Content-Type', 'application/json');
      return res.send(JSON.parse(cachedData));
    }

    cacheMissesTotal.inc();
    res.setHeader('X-Cache', 'MISS');
    req.cacheKey = cacheKey;
    next();
  } catch (error) {
    console.error('[Cache MW] Redis cache read error:', error);
    next();
  }
};
