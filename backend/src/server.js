import { assertEnv, env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { createApp } from './app.js';
import { startOrderExpiryJob } from './services/inventory.service.js';

async function start() {
  assertEnv();
  await connectDB();

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`[server] API running on ${env.apiUrl} (${env.nodeEnv})`);
    console.log(`[server] Images: ${env.cloudinary.enabled ? 'Cloudinary' : 'local /uploads'}`);
    console.log(`[server] Payments: ${env.razorpay.enabled ? 'Razorpay' : env.razorpay.mock ? 'MOCK gateway (dev)' : 'disabled'}`);
  });
  const expiryTimer = startOrderExpiryJob();

  const shutdown = (signal) => {
    console.log(`[server] ${signal} received, shutting down…`);
    clearInterval(expiryTimer);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (err) => console.error('[server] unhandled rejection', err));
}

start().catch((err) => {
  console.error('[server] failed to start:', err.message);
  process.exit(1);
});
