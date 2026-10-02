import mongoose from 'mongoose';

const storageNodeSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  address: { type: String, required: true },
  capacityBytes: { type: Number, required: true, min: 0 },
  usedBytes: { type: Number, required: true, min: 0, default: 0 },
  zone: { type: String, default: 'default', maxlength: 100 },
  status: { type: String, enum: ['online', 'suspect', 'offline', 'recovering'], default: 'online', index: true },
  lastHeartbeat: { type: Date, default: Date.now, index: true }
}, { timestamps: true, versionKey: false });

export default mongoose.model('StorageNode', storageNodeSchema);