const winston = require('winston');

const winstonLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console()
  ]
});

module.exports = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const latency = Date.now() - start;
    
    // Categorize targeted service
    let service = 'api-gateway';
    const path = req.originalUrl;
    if (path.startsWith('/auth')) {
      service = 'auth-service';
    } else if (path.startsWith('/users')) {
      service = 'user-service';
    } else if (path.startsWith('/products')) {
      service = 'product-service';
    }

    winstonLogger.info({
      requestId: req.id,
      method: req.method,
      path: path.split('?')[0], // log path without query parameters
      status: res.statusCode,
      latency,
      service
    });
  });

  next();
};
