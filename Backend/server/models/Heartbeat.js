import mongoose from 'mongoose';

const heartbeatSchema = new mongoose.Schema({
  nodeId: { type: String, required: true, index: true },
  receivedAt: { type: Date, default: Date.now },
  capacityBytes: { type: Number, required: true, min: 0 },
  usedBytes: { type: Number, required: true, min: 0 }
}, { versionKey: false });

heartbeatSchema.index({ receivedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

export default mongoose.model('Heartbeat', heartbeatSchema);