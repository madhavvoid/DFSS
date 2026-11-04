import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, lowercase: true, trim: true, maxlength: 254 },
  phone: { type: String, trim: true, maxlength: 16 }
}, { timestamps: true, autoIndex: false });

userSchema.index({ email: 1 }, { unique: true, sparse: true, name: 'user_email_unique_sparse' });
userSchema.index({ phone: 1 }, { unique: true, sparse: true, name: 'user_phone_unique_sparse' });

userSchema.pre('validate', function requireContactMethod() {
  if (!this.email && !this.phone) this.invalidate('email', 'An email address or phone number is required');
});

export default mongoose.model('User', userSchema);