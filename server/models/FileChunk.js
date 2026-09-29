import mongoose from 'mongoose';

const fileChunkSchema = new mongoose.Schema({
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: true, index: true },
  chunkId: { type: String, required: true, unique: true },
  index: { type: Number, required: true, min: 0 },
  size: { type: Number, required: true, min: 0 },
  sha256: { type: String, required: true, match: /^[a-f0-9]{64}$/ },
  state: { type: String, enum: ['planned', 'uploading', 'complete', 'under_replicated', 'failed'], default: 'planned' }
}, { timestamps: true });

fileChunkSchema.index({ fileId: 1, index: 1 }, { unique: true });

export default mongoose.model('FileChunk', fileChunkSchema);