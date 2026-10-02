import { createSha256 } from '../utils/hash.js';
import { safeFileName, removeTemporaryFile } from '../utils/fileUtils.js';
import { ApiError } from '../middleware/errorHandler.js';
import { config } from '../config/env.js';
import { hashFile, makeChunkId, readChunks } from '../services/chunkService.js';
import { listOnlineNodes, selectNodeCandidates } from '../services/nodeService.js';
import { deleteChunkReplicas, storeChunkReplicas } from '../services/replicationService.js';
import { getVerifiedChunk } from '../services/storageService.js';
import File from '../models/File.js';
import FileChunk from '../models/FileChunk.js';
import ChunkReplica from '../models/ChunkReplica.js';
import StorageNode from '../models/StorageNode.js';

function fileSummary(file) {
  return {
    id: file._id.toString(),
    name: file.originalName,
    size: file.size,
    chunkSize: file.chunkSize,
    chunkCount: file.chunkCount,
    sha256: file.sha256,
    replicationFactor: file.replicationFactor,
    status: file.status,
    createdAt: file.createdAt
  };
}

async function findOwnedFile(fileId, ownerId) {
  if (!/^[a-f\d]{24}$/i.test(fileId)) throw new ApiError(400, 'Invalid file ID');
  const file = await File.findOne({ _id: fileId, owner: ownerId });
  if (!file) throw new ApiError(404, 'File not found');
  return file;
}

export async function uploadFile(req, res) {
  let fileRecord;
  const createdChunks = [];
  try {
    if (!req.file) throw new ApiError(400, 'Choose a file to upload');
    const writeCandidates = await selectNodeCandidates();
    if (writeCandidates.length === 0) throw new ApiError(503, 'No healthy storage nodes with free capacity are available');

    const chunkSize = config.chunkSizeBytes;
    const desiredReplicas = Math.min(config.replicationFactor, writeCandidates.length);
    const fileSha256 = await hashFile(req.file.path);
    const chunkCount = Math.ceil(req.file.size / chunkSize);
    fileRecord = await File.create({
      owner: req.user.id,
      originalName: safeFileName(req.file.originalname),
      size: req.file.size,
      chunkSize,
      chunkCount,
      sha256: fileSha256,
      replicationFactor: desiredReplicas,
      status: 'uploading'
    });

    let index = 0;
    for await (const buffer of readChunks(req.file.path, chunkSize)) {
      const chunk = await FileChunk.create({
        fileId: fileRecord._id,
        chunkId: makeChunkId(fileRecord._id.toString(), index),
        index,
        size: buffer.length,
        sha256: createSha256().update(buffer).digest('hex'),
        state: 'uploading'
      });
      createdChunks.push(chunk);
      await storeChunkReplicas(chunk, buffer, desiredReplicas);
      chunk.state = 'complete';
      await chunk.save();
      index += 1;
    }

    fileRecord.status = 'complete';
    await fileRecord.save();
    return res.status(201).json({ file: fileSummary(fileRecord) });
  } catch (error) {
    await Promise.all(createdChunks.map((chunk) => deleteChunkReplicas(chunk).catch(() => {})));
    if (fileRecord) {
      await FileChunk.deleteMany({ fileId: fileRecord._id });
      await File.deleteOne({ _id: fileRecord._id });
    }
    throw error;
  } finally {
    await removeTemporaryFile(req.file?.path);
  }
}

export async function listFiles(req, res) {
  const requestedLimit = Number.parseInt(req.query.limit, 10) || 20;
  const limit = Math.min(Math.max(requestedLimit, 1), 100);
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const filter = { owner: req.user.id, status: 'complete' };
  const [files, total] = await Promise.all([
    File.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    File.countDocuments(filter)
  ]);
  return res.json({ files: files.map(fileSummary), page, limit, total });
}

export async function getFile(req, res) {
  const file = await findOwnedFile(req.params.fileId, req.user.id);
  const chunks = await FileChunk.find({ fileId: file._id }).sort({ index: 1 }).lean();
  const replicas = await ChunkReplica.find({ chunk: { $in: chunks.map((chunk) => chunk._id) } }).lean();
  const replicasByChunk = new Map();
  for (const replica of replicas) {
    const key = replica.chunk.toString();
    if (!replicasByChunk.has(key)) replicasByChunk.set(key, []);
    replicasByChunk.get(key).push({ nodeId: replica.nodeId, state: replica.state });
  }
  return res.json({
    file: fileSummary(file),
    chunks: chunks.map((chunk) => ({
      index: chunk.index,
      size: chunk.size,
      sha256: chunk.sha256,
      state: chunk.state,
      replicas: replicasByChunk.get(chunk._id.toString()) ?? []
    }))
  });
}

export async function getFileStatus(req, res) {
  const file = await findOwnedFile(req.params.fileId, req.user.id);
  const chunks = await FileChunk.find({ fileId: file._id }).select('state').lean();
  const counts = chunks.reduce((summary, chunk) => {
    summary[chunk.state] = (summary[chunk.state] ?? 0) + 1;
    return summary;
  }, {});
  return res.json({ fileId: file._id, status: file.status, chunkCount: file.chunkCount, chunks: counts });
}

async function* verifiedFileChunks(file, chunks) {
  const fullHash = createSha256();
  const onlineNodes = await listOnlineNodes();
  const onlineNodeIds = new Set(onlineNodes.map((node) => node._id));
  const nodeIds = new Set();
  for (const chunk of chunks) {
    const replicas = await ChunkReplica.find({ chunk: chunk._id, state: 'complete' }).lean();
    for (const replica of replicas) nodeIds.add(replica.nodeId);
    const nodes = await StorageNode.find({ _id: { $in: replicas.map((replica) => replica.nodeId) } }).lean();
    const nodeById = new Map(nodes.map((node) => [node._id, node]));
    const candidates = replicas
      .filter((replica) => onlineNodeIds.has(replica.nodeId))
      .map((replica) => ({ chunkId: chunk.chunkId, node: nodeById.get(replica.nodeId) }))
      .filter((replica) => replica.node);
    const { buffer } = await getVerifiedChunk(candidates, chunk.sha256);
    fullHash.update(buffer);
    yield buffer;
  }
  if (fullHash.digest('hex') !== file.sha256) throw new Error('Reconstructed file checksum does not match metadata');
}

export async function downloadFile(req, res) {
  const file = await findOwnedFile(req.params.fileId, req.user.id);
  if (file.status !== 'complete') throw new ApiError(409, 'File is not complete');
  const chunks = await FileChunk.find({ fileId: file._id, state: 'complete' }).sort({ index: 1 }).lean();
  if (chunks.length !== file.chunkCount) throw new ApiError(503, 'File metadata is incomplete');

  const name = safeFileName(file.originalName).replace(/[^a-zA-Z0-9._ -]/g, '_');
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Length', file.size);
  res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
  try {
    for await (const buffer of verifiedFileChunks(file, chunks)) {
      if (!res.write(buffer)) await new Promise((resolve) => res.once('drain', resolve));
    }
    return res.end();
  } catch (error) {
    console.error(`Download failed for ${file._id}: ${error.message}`);
    return res.destroy(error);
  }
}

export async function deleteFile(req, res) {
  const file = await findOwnedFile(req.params.fileId, req.user.id);
  const chunks = await FileChunk.find({ fileId: file._id });
  await Promise.all(chunks.map((chunk) => deleteChunkReplicas(chunk)));
  await FileChunk.deleteMany({ fileId: file._id });
  await File.deleteOne({ _id: file._id });
  return res.status(204).end();
}