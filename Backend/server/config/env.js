import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const configDirectory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(configDirectory, '../.env') });

function positiveInteger(name, fallback) {
  const value = Number.parseInt(process.env[name] ?? String(fallback), 10);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

export const config = {
  port: positiveInteger('PORT', 4000),
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/dfss',
  jwtSecret: process.env.JWT_SECRET ?? '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  smtpHost: process.env.SMTP_HOST ?? '',
  smtpPort: positiveInteger('SMTP_PORT', 587),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER ?? '',
  smtpPassword: process.env.SMTP_PASSWORD ?? '',
  smtpFrom: process.env.SMTP_FROM ?? '',
  developmentAuthCodes: process.env.NODE_ENV === 'development' && process.env.DEV_AUTH_CODES === 'true',
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? '',
  twilioFromPhone: process.env.TWILIO_FROM_PHONE ?? '',
  nodeSharedSecret: process.env.NODE_SHARED_SECRET ?? '',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  chunkSizeBytes: positiveInteger('CHUNK_SIZE_MB', 8) * 1024 * 1024,
  replicationFactor: positiveInteger('REPLICATION_FACTOR', 3),
  maxFileSizeBytes: positiveInteger('MAX_FILE_SIZE_MB', 1024) * 1024 * 1024,
  nodeTimeoutMs: positiveInteger('NODE_TIMEOUT_MS', 5000),
  heartbeatIntervalMs: positiveInteger('HEARTBEAT_INTERVAL_MS', 5000),
  nodeOfflineAfterMs: positiveInteger('NODE_OFFLINE_AFTER_MS', 20000)
};

export function validateConfig() {
  if (config.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters');
  }
  if (config.nodeSharedSecret.length < 32) {
    throw new Error('NODE_SHARED_SECRET must contain at least 32 characters');
  }
}