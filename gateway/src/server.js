const app = require('./app');
const config = require('./config/config');

app.listen(config.PORT, () => {
  console.log(`API Gateway listening on port ${config.PORT}`);
});
