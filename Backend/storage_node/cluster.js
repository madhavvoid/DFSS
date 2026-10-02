import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const nodeServer = path.join(moduleDirectory, 'server.js');
const count = Number.parseInt(process.env.NODE_COUNT ?? '3', 10);
const firstPort = Number.parseInt(process.env.NODE_PORT ?? '8101', 10);
const coordinatorUrl = process.env.COORDINATOR_URL ?? 'http://127.0.0.1:4000';
const sharedSecret = process.env.NODE_SHARED_SECRET ?? '';
if (!Number.isInteger(count) || count < 1 || count > 20) throw new Error('NODE_COUNT must be between 1 and 20');
if (sharedSecret.length < 32) throw new Error('NODE_SHARED_SECRET must contain at least 32 characters');

const children = [];
for (let index = 0; index < count; index += 1) {
  const nodeId = `node-${index + 1}`;
  const port = firstPort + index;
  const child = spawn(process.execPath, [nodeServer], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ID: nodeId,
      NODE_PORT: String(port),
      NODE_PUBLIC_URL: `http://127.0.0.1:${port}`,
      COORDINATOR_URL: coordinatorUrl,
      NODE_SHARED_SECRET: sharedSecret,
      STORAGE_DIR: path.join(moduleDirectory, 'data', nodeId),
      NODE_ZONE: `local-${index + 1}`
    }
  });
  children.push(child);
}

function stopChildren() {
  for (const child of children) child.kill('SIGTERM');
}

process.once('SIGINT', stopChildren);
process.once('SIGTERM', stopChildren);