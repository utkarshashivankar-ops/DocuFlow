const { config, validateConfig } = require('./config/env');

async function main() {
  validateConfig();
  const { connectDB } = require('./config/db');
  await connectDB();
  await require('./services/documentProcessor').recoverStuck();

  const app = require('./app');
  const server = app.listen(config.port, '0.0.0.0', () => {
    console.log(`[server] DocuFlow API listening on http://0.0.0.0:${config.port}  (${config.env})`);
  });

  require('./services/scheduler').start();

  const shutdown = () => server.close(() => require('mongoose').connection.close(false).then(() => process.exit(0)));
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[server] failed to start:', err.message);
  process.exit(1);
});
