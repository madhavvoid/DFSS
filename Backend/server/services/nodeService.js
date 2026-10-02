import StorageNode from '../models/StorageNode.js';
import Heartbeat from '../models/Heartbeat.js';
import { config } from '../config/env.js';
import { ApiError } from '../middleware/errorHandler.js';

let placementCursor = 0;

export function validateNodeAddress(address) {
  let parsed;
  try {
    parsed = new URL(address);
  } catch {
    throw new ApiError(400, 'Node address must be a valid HTTP or HTTPS URL');
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new ApiError(400, 'Node address must be a valid HTTP or HTTPS URL');
  }
  return parsed.toString().replace(/\/$/, '');
}

export async function registerNode({ nodeId, address, capacityBytes, usedBytes = 0, zone = 'default' }) {
  if (typeof nodeId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(nodeId)) {
    throw new ApiError(400, 'nodeId must contain only letters, numbers, underscores, or hyphens');
  }
  const normalizedAddress = validateNodeAddress(address);
  if (!Number.isSafeInteger(capacityBytes) || capacityBytes <= 0 || !Number.isSafeInteger(usedBytes) || usedBytes < 0) {
    throw new ApiError(400, 'Node capacity and used bytes must be valid non-negative integers');
  }
  return StorageNode.findOneAndUpdate(
    { _id: nodeId },
    { $set: { address: normalizedAddress, capacityBytes, usedBytes, zone: String(zone).slice(0, 100), status: 'online', lastHeartbeat: new Date() } },
    { upsert: true, new: true, runValidators: true }
  );
}

export async function recordHeartbeat(nodeId, metrics) {
  const { capacityBytes, usedBytes } = metrics;
  if (!Number.isSafeInteger(capacityBytes) || capacityBytes <= 0 || !Number.isSafeInteger(usedBytes) || usedBytes < 0) {
    throw new ApiError(400, 'Heartbeat capacity and used bytes must be valid non-negative integers');
  }
  const receivedAt = new Date();
  const node = await StorageNode.findByIdAndUpdate(nodeId, {
    $set: { capacityBytes, usedBytes, status: 'online', lastHeartbeat: receivedAt }
  }, { new: true, runValidators: true });
  if (!node) throw new ApiError(404, 'Storage node is not registered');
  await Heartbeat.create({ nodeId, capacityBytes, usedBytes, receivedAt });
  return node;
}

export async function listOnlineNodes() {
  const cutoff = new Date(Date.now() - config.nodeOfflineAfterMs);
  return StorageNode.find({
    status: 'online',
    lastHeartbeat: { $gte: cutoff }
  }).sort({ _id: 1 });
}

export async function selectNodeCandidates(excludedIds = []) {
  const excluded = new Set(excludedIds);
  const candidates = (await listOnlineNodes()).filter((node) => (
    !excluded.has(node._id) && node.usedBytes < node.capacityBytes
  ));
  candidates.sort((left, right) => {
    const leftUsage = left.usedBytes / Math.max(left.capacityBytes, 1);
    const rightUsage = right.usedBytes / Math.max(right.capacityBytes, 1);
    return leftUsage - rightUsage || left._id.localeCompare(right._id);
  });
  if (candidates.length) {
    const offset = placementCursor % candidates.length;
    placementCursor += 1;
    return [...candidates.slice(offset), ...candidates.slice(0, offset)];
  }
  return candidates;
}

export async function markOfflineNodes() {
  const cutoff = new Date(Date.now() - config.nodeOfflineAfterMs);
  const result = await StorageNode.updateMany(
    { status: { $ne: 'offline' }, lastHeartbeat: { $lt: cutoff } },
    { $set: { status: 'offline' } }
  );
  return result.modifiedCount;
}

export async function listNodes() {
  await markOfflineNodes();
  return StorageNode.find().sort({ _id: 1 }).lean();
}