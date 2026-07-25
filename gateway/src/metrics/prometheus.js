const client = require('prom-client');

const register = new client.Registry();

// Default metrics (system CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Core Custom Metrics
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests processed',
  labelNames: ['method', 'path', 'status', 'service'],
});

const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Latency of HTTP requests in seconds',
  labelNames: ['method', 'path', 'service'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
});

const rateLimitedRequestsTotal = new client.Counter({
  name: 'rate_limited_requests_total',
  help: 'Total number of requests that were rate limited',
});

const cacheHitsTotal = new client.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits in Redis',
});

const cacheMissesTotal = new client.Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses in Redis',
});

// Register metrics
register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDurationSeconds);
register.registerMetric(rateLimitedRequestsTotal);
register.registerMetric(cacheHitsTotal);
register.registerMetric(cacheMissesTotal);

// Middleware to track request rates and latency
const metricsMiddleware = (req, res, next) => {
  const start = process.hrtime();
  
  res.on('finish', () => {
    const path = req.originalUrl.split('?')[0];
    if (path === '/metrics' || path === '/health') return;

    let service = 'api-gateway';
    if (path.startsWith('/auth')) service = 'auth-service';
    else if (path.startsWith('/users')) service = 'user-service';
    else if (path.startsWith('/products')) service = 'product-service';

    const diff = process.hrtime(start);
    const duration = diff[0] + diff[1] / 1e9;

    httpRequestsTotal.inc({
      method: req.method,
      path,
      status: res.statusCode,
      service
    });

    httpRequestDurationSeconds.observe(
      { method: req.method, path, service },
      duration
    );
  });

  next();
};

module.exports = {
  register,
  metricsMiddleware,
  rateLimitedRequestsTotal,
  cacheHitsTotal,
  cacheMissesTotal,
};
