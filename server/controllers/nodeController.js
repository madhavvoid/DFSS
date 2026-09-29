import { ApiError } from '../middleware/errorHandler.js';
import { registerNode, recordHeartbeat, listNodes } from '../services/nodeService.js';
import { repairUnderReplicatedChunks } from '../services/replicationService.js';

export async function register(req, res) {
  const node = await registerNode(req.body);
  return res.status(201).json({ nodeId: node._id, status: node.status });
}

export async function heartbeat(req, res) {
  const node = await recordHeartbeat(req.params.nodeId, req.body);
  return res.json({ nodeId: node._id, status: node.status, lastHeartbeat: node.lastHeartbeat });
}

export async function getNodes(req, res) {
  const nodes = await listNodes();
  return res.json({ nodes: nodes.map((node) => ({
    id: node._id,
    address: node.address,
    capacityBytes: node.capacityBytes,
    usedBytes: node.usedBytes,
    zone: node.zone,
    status: node.status,
    lastHeartbeat: node.lastHeartbeat
  })) });
}

export async function rebalance(req, res) {
  const repaired = await repairUnderReplicatedChunks();
  return res.json({ repairedChunks: repaired });
}