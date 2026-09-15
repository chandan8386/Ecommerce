import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('strictQuery', true);

/** Connection diagnostics exposed at /api/health (credentials are always masked). */
export const dbState = { attempts: 0, lastError: null, connectedAt: null };

const maskUri = (text) => String(text).replace(/mongodb(\+srv)?:\/\/[^\s@/]+@/gi, 'mongodb$1://***@');

/** Single connection attempt (used by the seed script). Throws on failure. */
export async function connectDB(uri = env.mongoUri) {
  const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
}

/**
 * Keeps trying to connect with exponential backoff (5s → 60s) instead of exiting,
 * so the API stays up and can report why the database is unreachable.
 */
export function connectWithRetry({ onConnected } = {}) {
  let delay = 5000;
  let stopped = false;

  const attempt = async () => {
    if (stopped) return;
    dbState.attempts += 1;
    try {
      await connectDB();
      dbState.lastError = null;
      dbState.connectedAt = new Date().toISOString();
      await onConnected?.();
    } catch (err) {
      dbState.lastError = maskUri(err?.message || err);
      console.error(`[db] connection attempt ${dbState.attempts} failed: ${dbState.lastError} (retrying in ${delay / 1000}s)`);
      setTimeout(attempt, delay);
      delay = Math.min(delay * 2, 60000);
    }
  };

  attempt();
  return () => {
    stopped = true;
  };
}

export const isDBConnected = () => mongoose.connection.readyState === 1;

export async function disconnectDB() {
  await mongoose.connection.close();
}
