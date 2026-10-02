import http from 'node:http';
import app from './app.js';
import { config, validateConfig } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { ensureUploadDirectory } from './utils/fileUtils.js';
import { markOfflineNodes } from './services/nodeService.js';
import { repairUnderReplicatedChunks } from './services/replicationService.js';

let repairRunning = false;

async function start() {
  validateConfig();
  await ensureUploadDirectory();
  await connectDatabase();

  const server = http.createServer(app);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(config.port, resolve);
  });
  console.info(`DFSS coordinator listening on port ${config.port}`);

  const recoveryTimer = setInterval(async () => {
    if (repairRunning) return;
    repairRunning = true;
    try {
      await markOfflineNodes();
      const repaired = await repairUnderReplicatedChunks();
      if (repaired) console.info(`Repaired ${repaired} chunk replica(s)`);
    } catch (error) {
      console.error(`Recovery pass failed: ${error.message}`);
    } finally {
      repairRunning = false;
    }
  }, Math.max(config.nodeOfflineAfterMs, 30000));
  recoveryTimer.unref();

  const shutdown = async () => {
    clearInterval(recoveryTimer);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

start().catch(async (error) => {
  console.error(`Could not start DFSS coordinator: ${error.message}`);
  await disconnectDatabase().catch(() => {});
  process.exitCode = 1;
});