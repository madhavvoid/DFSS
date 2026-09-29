import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  originalName: { type: String, required: true, maxlength: 255 },
  size: { type: Number, required: true, min: 0 },
  chunkSize: { type: Number, required: true, min: 1 },
  chunkCount: { type: Number, required: true, min: 0 },
  sha256: { type: String, required: true, match: /^[a-f0-9]{64}$/ },
  replicationFactor: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ['uploading', 'complete', 'failed'], default: 'uploading', index: true }
}, { timestamps: true });

export default mongoose.model('File', fileSchema);