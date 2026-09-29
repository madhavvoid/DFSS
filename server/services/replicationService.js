import ChunkReplica from '../models/ChunkReplica.js';
import File from '../models/File.js';
import FileChunk from '../models/FileChunk.js';
import StorageNode from '../models/StorageNode.js';
import { ApiError } from '../middleware/errorHandler.js';
import { deleteChunk, getVerifiedChunk, putChunk } from './storageService.js';
import { listOnlineNodes, selectNodeCandidates } from './nodeService.js';

export async function storeChunkReplicas(chunk, buffer, desiredCopies) {
  const candidates = await selectNodeCandidates();
  const writtenNodes = [];

  try {
    for (const node of candidates) {
      try {
        await putChunk(node, chunk.chunkId, buffer, chunk.sha256);
        try {
          await ChunkReplica.create({ chunk: chunk._id, nodeId: node._id, state: 'complete' });
          writtenNodes.push(node);
        } catch (error) {
          await deleteChunk(node, chunk.chunkId);
          throw error;
        }
        if (writtenNodes.length === desiredCopies) break;
      } catch (error) {
        console.warn(`Replica write failed on ${node._id}: ${error.message}`);
      }
    }

    if (writtenNodes.length < desiredCopies) {
      throw new ApiError(503, `Could only store ${writtenNodes.length} of ${desiredCopies} required replicas`);
    }
    return writtenNodes.map((node) => node._id);
  } catch (error) {
    await Promise.all(writtenNodes.map((node) => deleteChunk(node, chunk.chunkId)));
    await ChunkReplica.deleteMany({ chunk: chunk._id });
    throw error;
  }
}

export async function deleteChunkReplicas(chunk) {
  const replicas = await ChunkReplica.find({ chunk: chunk._id }).lean();
  const nodeIds = [...new Set(replicas.map((replica) => replica.nodeId))];
  const nodes = await StorageNode.find({ _id: { $in: nodeIds } }).lean();
  await Promise.all(nodes.map((node) => deleteChunk(node, chunk.chunkId)));
  await ChunkReplica.deleteMany({ chunk: chunk._id });
}

export async function repairUnderReplicatedChunks() {
  const chunks = await FileChunk.find({ state: { $in: ['complete', 'under_replicated'] } });
  let repaired = 0;

  for (const chunk of chunks) {
    const file = await File.findById(chunk.fileId).lean();
    if (!file || file.status !== 'complete') continue;

    const replicaRecords = await ChunkReplica.find({ chunk: chunk._id, state: 'complete' }).lean();
    const existingNodeIds = replicaRecords.map((replica) => replica.nodeId);
    const [nodes, onlineNodes] = await Promise.all([
      StorageNode.find({ _id: { $in: existingNodeIds } }).lean(),
      listOnlineNodes()
    ]);
    const onlineNodeIds = new Set(onlineNodes.map((node) => node._id));
    const nodeById = new Map(nodes.map((node) => [node._id, node]));
    const healthyReplicas = replicaRecords
      .map((replica) => ({ ...replica, node: nodeById.get(replica.nodeId), chunkId: chunk.chunkId }))
      .filter((replica) => replica.node && onlineNodeIds.has(replica.nodeId));

    if (healthyReplicas.length >= file.replicationFactor) {
      if (chunk.state !== 'complete') {
        chunk.state = 'complete';
        await chunk.save();
      }
      continue;
    }

    if (healthyReplicas.length === 0) {
      chunk.state = 'under_replicated';
      await chunk.save();
      continue;
    }

    try {
      const { buffer } = await getVerifiedChunk(healthyReplicas, chunk.sha256);
      const destinations = await selectNodeCandidates(existingNodeIds);
      for (const node of destinations) {
        try {
          await putChunk(node, chunk.chunkId, buffer, chunk.sha256);
          await ChunkReplica.create({ chunk: chunk._id, nodeId: node._id, state: 'complete' });
          healthyReplicas.push({ node });
          repaired += 1;
          if (healthyReplicas.length >= file.replicationFactor) break;
        } catch (error) {
          console.warn(`Repair write failed on ${node._id}: ${error.message}`);
        }
      }
      chunk.state = healthyReplicas.length >= file.replicationFactor ? 'complete' : 'under_replicated';
      await chunk.save();
    } catch (error) {
      console.warn(`Could not repair ${chunk.chunkId}: ${error.message}`);
      chunk.state = 'under_replicated';
      await chunk.save();
    }
  }
  return repaired;
}