import mongoose from 'mongoose';

const chunkReplicaSchema = new mongoose.Schema({
  chunk: { type: mongoose.Schema.Types.ObjectId, ref: 'FileChunk', required: true, index: true },
  nodeId: { type: String, ref: 'StorageNode', required: true },
  state: { type: String, enum: ['complete', 'stale', 'failed'], default: 'complete', index: true },
  lastVerifiedAt: { type: Date, default: Date.now }
}, { timestamps: true });

chunkReplicaSchema.index({ chunk: 1, nodeId: 1 }, { unique: true });

export default mongoose.model('ChunkReplica', chunkReplicaSchema);