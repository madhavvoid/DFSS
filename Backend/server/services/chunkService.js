import { createReadStream } from 'node:fs';
import { createSha256 } from '../utils/hash.js';

export async function hashFile(filePath) {
  const hash = createSha256();
  for await (const part of createReadStream(filePath)) hash.update(part);
  return hash.digest('hex');
}

export async function* readChunks(filePath, chunkSize) {
  let pending = Buffer.alloc(0);
  for await (const part of createReadStream(filePath, { highWaterMark: 64 * 1024 })) {
    pending = pending.length ? Buffer.concat([pending, part]) : part;
    while (pending.length >= chunkSize) {
      yield pending.subarray(0, chunkSize);
      pending = pending.subarray(chunkSize);
    }
  }
  if (pending.length) yield pending;
}

export function makeChunkId(fileId, index) {
  return `${fileId}-chunk-${index}`;
}