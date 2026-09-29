import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { hashFile, makeChunkId, readChunks } from '../services/chunkService.js';
import { sha256 } from '../utils/hash.js';

test('readChunks preserves data and emits fixed-size chunks plus a final partial chunk', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'dfss-chunks-'));
  const filePath = path.join(directory, 'sample.bin');
  const contents = Buffer.from('abcdefghij');
  await writeFile(filePath, contents);

  try {
    const chunks = [];
    for await (const chunk of readChunks(filePath, 4)) chunks.push(chunk);
    assert.deepEqual(chunks.map((chunk) => chunk.length), [4, 4, 2]);
    assert.deepEqual(Buffer.concat(chunks), contents);
    assert.equal(await hashFile(filePath), sha256(contents));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('readChunks emits no chunks for an empty file and chunk IDs are stable', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'dfss-chunks-'));
  const filePath = path.join(directory, 'empty.bin');
  await writeFile(filePath, Buffer.alloc(0));

  try {
    const chunks = [];
    for await (const chunk of readChunks(filePath, 4)) chunks.push(chunk);
    assert.deepEqual(chunks, []);
    assert.equal(await hashFile(filePath), sha256(Buffer.alloc(0)));
    assert.equal(makeChunkId('file-id', 3), 'file-id-chunk-3');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});