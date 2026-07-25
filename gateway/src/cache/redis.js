const { createClient } = require('redis');
const config = require('../config/config');

const client = createClient({
  url: config.REDIS_URL
});

client.on('error', (err) => console.error('Redis Client Error', err));
client.on('connect', () => console.log('Connected to Redis successfully'));

// Connect to Redis asynchronously
client.connect().catch(err => {
  console.error('Failed to connect to Redis:', err.message);
});

module.exports = client;
