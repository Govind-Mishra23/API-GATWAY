const express = require('express');
const cors = require('cors');
const requestIdMiddleware = require('./middleware/requestId');
const loggerMiddleware = require('./middleware/logger');
const rateLimiterMiddleware = require('./middleware/rateLimiter');
const { metricsMiddleware, register } = require('./metrics/prometheus');
const gatewayRoutes = require('./routes/gatewayRoutes');

const app = express();

app.use(cors());

// 1. Prometheus Metrics (registered early to measure all traffic)
app.use(metricsMiddleware);

// 2. Distributed Tracing & Logging
app.use(requestIdMiddleware);
app.use(loggerMiddleware);

// 3. Redis-backed Rate Limiter
app.use(rateLimiterMiddleware);

// 4. Metrics Scrape Endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

// 5. Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({ service: 'api-gateway', status: 'up' });
});

// 6. Gateway Routing and Proxying
// Note: We intentionally avoid registering global express.json() or urlencoded() middleware 
// on the gateway level. Doing so would consume the request payload stream and break proxy 
// forwarding for POST/PUT requests. Downstream services handle their own body parsing.
app.use('/', gatewayRoutes);

module.exports = app;
