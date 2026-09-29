import { config } from '../config/env.js';
import { sha256 } from '../utils/hash.js';

function nodeUrl(node, chunkId) {
  return `${node.address}/chunks/${encodeURIComponent(chunkId)}`;
}

function nodeHeaders(headers = {}) {
  return { 'x-node-token': config.nodeSharedSecret, ...headers };
}

export async function putChunk(node, chunkId, buffer, digest) {
  const response = await fetch(nodeUrl(node, chunkId), {
    method: 'PUT',
    headers: nodeHeaders({ 'content-type': 'application/octet-stream', 'x-chunk-sha256': digest }),
    body: buffer,
    signal: AbortSignal.timeout(config.nodeTimeoutMs)
  });
  if (!response.ok) throw new Error(`Node ${node._id} rejected a chunk (${response.status})`);
  const result = await response.json();
  if (result.sha256 !== digest) throw new Error(`Node ${node._id} returned an invalid chunk checksum`);
  return result;
}

export async function getVerifiedChunk(replicas, expectedHash) {
  const failures = [];
  for (const replica of replicas) {
    try {
      const response = await fetch(nodeUrl(replica.node, replica.chunkId), {
        headers: nodeHeaders(),
        signal: AbortSignal.timeout(config.nodeTimeoutMs)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      if (sha256(buffer) !== expectedHash) throw new Error('SHA-256 mismatch');
      return { buffer, nodeId: replica.node._id };
    } catch (error) {
      failures.push(`${replica.node._id}: ${error.message}`);
    }
  }
  throw new Error(`No verified replica could be read${failures.length ? ` (${failures.join('; ')})` : ''}`);
}

export async function deleteChunk(node, chunkId) {
  try {
    const response = await fetch(nodeUrl(node, chunkId), {
      method: 'DELETE',
      headers: nodeHeaders(),
      signal: AbortSignal.timeout(config.nodeTimeoutMs)
    });
    return response.ok || response.status === 404;
  } catch {
    return false;
  }
}