import assert from 'node:assert/strict';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { sha256 } from '../utils/hash.js';

const storageNodeScript = fileURLToPath(new URL('../../storage_node/server.js', import.meta.url));

async function unusedPort() {
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', resolve);
  });
  const { port } = probe.address();
  await new Promise((resolve) => probe.close(resolve));
  return port;
}

test('storage node protects and verifies chunk operations', async () => {
  const port = await unusedPort();
  const directory = await mkdtemp(path.join(os.tmpdir(), 'dfss-node-'));
  const secret = 'test-node-secret-that-is-at-least-32-characters';
  const child = spawn(process.execPath, [storageNodeScript], {
    env: {
      ...process.env,
      NODE_ID: 'test-node',
      NODE_PORT: String(port),
      NODE_SHARED_SECRET: secret,
      COORDINATOR_URL: 'http://127.0.0.1:1',
      STORAGE_DIR: directory
    },
    stdio: 'ignore'
  });

  try {
    const baseUrl = `http://127.0.0.1:${port}`;
    const deadline = Date.now() + 5000;
    let healthy = false;
    while (Date.now() < deadline && !healthy) {
      if (child.exitCode !== null) throw new Error(`Storage node exited with code ${child.exitCode}`);
      try {
        healthy = (await fetch(`${baseUrl}/health`)).ok;
      } catch {
        await delay(50);
      }
    }
    assert.equal(healthy, true, 'storage node should start and answer health checks');

    const chunkId = 'test-file-chunk-0';
    const body = Buffer.from('distributed chunk data');
    const digest = sha256(body);
    const unauthorized = await fetch(`${baseUrl}/chunks/${chunkId}`);
    assert.equal(unauthorized.status, 401);

    const headers = {
      'x-node-token': secret,
      'x-chunk-sha256': digest,
      'content-type': 'application/octet-stream'
    };
    const stored = await fetch(`${baseUrl}/chunks/${chunkId}`, { method: 'PUT', headers, body });
    assert.equal(stored.status, 201);
    assert.equal((await stored.json()).sha256, digest);

    const read = await fetch(`${baseUrl}/chunks/${chunkId}`, { headers: { 'x-node-token': secret } });
    assert.equal(read.status, 200);
    assert.deepEqual(Buffer.from(await read.arrayBuffer()), body);
    assert.equal(read.headers.get('x-chunk-sha256'), digest);

    const badWrite = await fetch(`${baseUrl}/chunks/bad-chunk`, {
      method: 'PUT',
      headers: { ...headers, 'x-chunk-sha256': '0'.repeat(64) },
      body
    });
    assert.equal(badWrite.status, 400);

    const deleted = await fetch(`${baseUrl}/chunks/${chunkId}`, {
      method: 'DELETE',
      headers: { 'x-node-token': secret }
    });
    assert.equal(deleted.status, 204);
    const missing = await fetch(`${baseUrl}/chunks/${chunkId}`, { headers: { 'x-node-token': secret } });
    assert.equal(missing.status, 404);
  } finally {
    child.kill('SIGTERM');
    if (child.exitCode === null) {
      await Promise.race([once(child, 'exit'), delay(1000)]);
      if (child.exitCode === null) child.kill('SIGKILL');
    }
    await rm(directory, { recursive: true, force: true });
  }
});