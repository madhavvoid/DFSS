import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, readFile, readdir, rename, rm, stat, statfs, writeFile } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const nodeId = process.env.NODE_ID ?? 'node-1';
const port = Number.parseInt(process.env.NODE_PORT ?? '8101', 10);
const coordinatorUrl = (process.env.COORDINATOR_URL ?? 'http://127.0.0.1:4000').replace(/\/$/, '');
const publicUrl = (process.env.NODE_PUBLIC_URL ?? `http://127.0.0.1:${port}`).replace(/\/$/, '');
const sharedSecret = process.env.NODE_SHARED_SECRET ?? '';
const maxChunkBytes = Number.parseInt(process.env.MAX_CHUNK_BYTES ?? String(64 * 1024 * 1024), 10);
const heartbeatIntervalMs = Number.parseInt(process.env.HEARTBEAT_INTERVAL_MS ?? '5000', 10);
const storageDirectory = path.resolve(process.env.STORAGE_DIR ?? path.join(moduleDirectory, 'data', nodeId));
const chunkIdPattern = /^[a-zA-Z0-9_-]{1,150}$/;

function sendJson(response, status, body) {
  const content = Buffer.from(JSON.stringify(body));
  response.writeHead(status, { 'content-type': 'application/json', 'content-length': content.length });
  response.end(content);
}

function hasValidSecret(request) {
  const provided = Buffer.from(request.headers['x-node-token'] ?? '');
  const expected = Buffer.from(sharedSecret);
  return expected.length > 0 && provided.length === expected.length && timingSafeEqual(provided, expected);
}

async function storageMetrics() {
  const entries = await readdir(storageDirectory, { withFileTypes: true });
  let usedBytes = 0;
  for (const entry of entries) {
    if (!entry.isFile() || entry.name.endsWith('.meta') || entry.name.endsWith('.tmp')) continue;
    usedBytes += (await stat(path.join(storageDirectory, entry.name))).size;
  }
  const disk = await statfs(storageDirectory);
  const availableBytes = Number(disk.bavail) * Number(disk.bsize);
  return { capacityBytes: availableBytes + usedBytes, usedBytes };
}

async function coordinatorRequest(pathname, body) {
  const response = await fetch(`${coordinatorUrl}${pathname}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-node-token': sharedSecret },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(5000)
  });
  if (!response.ok) throw new Error(`Coordinator returned ${response.status}`);
}

async function sendRegistration() {
  const metrics = await storageMetrics();
  await coordinatorRequest('/api/nodes/register', {
    nodeId,
    address: publicUrl,
    ...metrics,
    zone: process.env.NODE_ZONE ?? 'local'
  });
}

async function sendHeartbeat() {
  const metrics = await storageMetrics();
  await coordinatorRequest(`/api/nodes/${encodeURIComponent(nodeId)}/heartbeat`, metrics);
}

async function storeChunk(request, response, chunkId) {
  const expectedHash = String(request.headers['x-chunk-sha256'] ?? '');
  if (!/^[a-f0-9]{64}$/.test(expectedHash)) return sendJson(response, 400, { error: 'A valid x-chunk-sha256 header is required' });
  const contentLength = Number(request.headers['content-length'] ?? 0);
  if (contentLength > maxChunkBytes) return sendJson(response, 413, { error: 'Chunk exceeds the storage-node limit' });

  const target = path.join(storageDirectory, chunkId);
  const temporary = path.join(storageDirectory, `.${chunkId}.${randomUUID()}.tmp`);
  const hash = createHash('sha256');
  let size = 0;
  const limiter = new Transform({
    transform(part, encoding, callback) {
      size += part.length;
      if (size > maxChunkBytes) return callback(new Error('Chunk exceeds the storage-node limit'));
      hash.update(part);
      return callback(null, part);
    }
  });

  try {
    await pipeline(request, limiter, createWriteStream(temporary, { flags: 'wx' }));
    const actualHash = hash.digest('hex');
    if (actualHash !== expectedHash) throw new Error('Chunk SHA-256 does not match the request');
    await rename(temporary, target);
    await writeFile(`${target}.meta`, JSON.stringify({ sha256: actualHash, size }));
    return sendJson(response, 201, { nodeId, chunkId, size, sha256: actualHash });
  } catch (error) {
    await rm(temporary, { force: true });
    await rm(target, { force: true });
    await rm(`${target}.meta`, { force: true });
    return sendJson(response, error.message.includes('limit') ? 413 : 400, { error: error.message });
  }
}

async function handleRequest(request, response) {
  const url = new URL(request.url, `http://${request.headers.host ?? 'localhost'}`);
  if (request.method === 'GET' && url.pathname === '/health') {
    const metrics = await storageMetrics();
    return sendJson(response, 200, { status: 'ok', nodeId, ...metrics });
  }
  if (!hasValidSecret(request)) return sendJson(response, 401, { error: 'Invalid storage-node credentials' });

  const match = url.pathname.match(/^\/chunks\/([^/]+)$/);
  if (!match) return sendJson(response, 404, { error: 'Route not found' });
  let chunkId;
  try {
    chunkId = decodeURIComponent(match[1]);
  } catch {
    return sendJson(response, 400, { error: 'Invalid chunk ID' });
  }
  if (!chunkIdPattern.test(chunkId)) return sendJson(response, 400, { error: 'Invalid chunk ID' });

  const chunkPath = path.join(storageDirectory, chunkId);
  const metadataPath = `${chunkPath}.meta`;

  if (request.method === 'PUT') return storeChunk(request, response, chunkId);
  if (request.method === 'HEAD' || request.method === 'GET') {
    try {
      const metadata = JSON.parse(await readFile(metadataPath, 'utf8'));
      if (request.method === 'HEAD') {
        response.writeHead(200, { 'content-length': metadata.size, 'x-chunk-sha256': metadata.sha256 });
        return response.end();
      }
      response.writeHead(200, {
        'content-type': 'application/octet-stream',
        'content-length': metadata.size,
        'x-chunk-sha256': metadata.sha256
      });
      await pipeline(createReadStream(chunkPath), response);
      return;
    } catch (error) {
      if (response.headersSent) return response.destroy(error);
      return sendJson(response, error.code === 'ENOENT' ? 404 : 500, { error: 'Chunk is unavailable' });
    }
  }
  if (request.method === 'DELETE') {
    await Promise.all([rm(chunkPath, { force: true }), rm(metadataPath, { force: true })]);
    response.writeHead(204);
    return response.end();
  }
  response.setHeader('allow', 'GET, HEAD, PUT, DELETE');
  return sendJson(response, 405, { error: 'Method not allowed' });
}

async function start() {
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(nodeId)) throw new Error('NODE_ID contains unsupported characters');
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be a valid TCP port');
  if (sharedSecret.length < 32) throw new Error('NODE_SHARED_SECRET must contain at least 32 characters');
  await mkdir(storageDirectory, { recursive: true });

  const server = http.createServer((request, response) => {
    handleRequest(request, response).catch((error) => {
      console.error(`Storage-node request failed: ${error.message}`);
      if (!response.headersSent) sendJson(response, 500, { error: 'Storage-node request failed' });
      else response.destroy(error);
    });
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, resolve);
  });
  console.info(`Storage node ${nodeId} listening on port ${port}`);

  const registerAndHeartbeat = async () => {
    try {
      await sendRegistration();
    } catch {
      await sendHeartbeat();
    }
  };
  registerAndHeartbeat().catch((error) => console.warn(`Coordinator unavailable: ${error.message}`));
  const heartbeatTimer = setInterval(() => {
    sendHeartbeat().catch((error) => console.warn(`Heartbeat failed: ${error.message}`));
  }, heartbeatIntervalMs);
  heartbeatTimer.unref();

  const shutdown = () => {
    clearInterval(heartbeatTimer);
    server.close(() => process.exit(0));
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

start().catch((error) => {
  console.error(`Could not start storage node: ${error.message}`);
  process.exitCode = 1;
});