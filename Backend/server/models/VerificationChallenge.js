import mongoose from 'mongoose';

const verificationChallengeSchema = new mongoose.Schema({
  accountKey: { type: String, required: true, unique: true },
  codeDigest: { type: String, required: true },
  intent: { type: String, enum: ['signup', 'signin'], required: true },
  channel: { type: String, enum: ['email', 'sms'], required: true },
  expiresAt: { type: Date, required: true },
  sentAt: { type: Date, required: true },
  attempts: { type: Number, default: 0, min: 0 }
}, { versionKey: false });

verificationChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('VerificationChallenge', verificationChallengeSchema);