import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertEnv, env } from './config/env.js';
import { connectWithRetry, disconnectDB } from './config/db.js';
import { createApp } from './app.js';
import { Product, User } from './models/index.js';
import { startOrderExpiryJob } from './services/inventory.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Loads demo data once, only when the database is completely empty (set AUTO_SEED=false to disable). */
async function autoSeedIfEmpty() {
  if (process.env.AUTO_SEED === 'false') return;
  const [users, products] = await Promise.all([User.estimatedDocumentCount(), Product.estimatedDocumentCount()]);
  if (users > 0 || products > 0) return;
  console.log('[seed] Empty database detected - loading demo catalogue and admin account');
  const child = spawn(process.execPath, [path.join(__dirname, 'seed', 'seed.js')], { stdio: 'inherit', env: process.env });
  child.on('exit', (code) => console.log(`[seed] finished with exit code ${code}`));
}

function start() {
  assertEnv();

  // Listen first so the platform health check and /api/health respond even while the database is unavailable.
  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`[server] API running on ${env.apiUrl} (${env.nodeEnv}) on port ${env.port}`);
    console.log(`[server] Images: ${env.cloudinary.enabled ? 'Cloudinary' : 'local /uploads'}`);
    console.log(`[server] Payments: ${env.razorpay.enabled ? 'Razorpay' : env.razorpay.mock ? 'MOCK gateway (dev)' : 'disabled (COD only)'}`);
    console.log(`[server] Allowed origins: ${env.clientUrls.join(', ')}`);
  });

  let expiryTimer = null;
  const stopRetry = connectWithRetry({
    onConnected: async () => {
      if (!expiryTimer) expiryTimer = startOrderExpiryJob();
      await autoSeedIfEmpty().catch((err) => console.error('[seed] auto-seed failed:', err.message));
    },
  });

  const shutdown = (signal) => {
    console.log(`[server] ${signal} received, shutting down...`);
    stopRetry();
    if (expiryTimer) clearInterval(expiryTimer);
    server.close(async () => {
      await disconnectDB().catch(() => {});
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (err) => console.error('[server] unhandled rejection', err));
}

start();
