const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redisClient = require('../cache/redis');
const { rateLimitedRequestsTotal } = require('../metrics/prometheus');

const rateLimiter = rateLimit({
  store: new RedisStore({
    // Pass the native sendCommand function of the redis npm package client
    sendCommand: (...args) => redisClient.sendCommand(args),
  }),
  windowMs: 60 * 1000, // 1 minute window
  max: 30, // Limit each IP to 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    // Record rate limit hit in metrics
    rateLimitedRequestsTotal.inc();
    res.status(options.statusCode).json({
      message: 'Too many requests. Rate limit exceeded.'
    });
  }
});

module.exports = rateLimiter;
