import mongoose from 'mongoose';
import { config } from './env.js';

export async function connectDatabase() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 10000 });
  console.info('Connected to MongoDB');
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}