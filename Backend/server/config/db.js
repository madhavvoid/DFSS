import mongoose from 'mongoose';
import { config } from './env.js';
import User from '../models/User.js';

async function ensureUserContactIndexes() {
  const collection = mongoose.connection.collection(User.collection.collectionName);
  const indexes = await collection.indexes().catch((error) => {
    if (error.codeName === 'NamespaceNotFound') return [];
    throw error;
  });
  const expected = new Set(['user_email_unique_sparse', 'user_phone_unique_sparse']);

  for (const index of indexes) {
    if ((index.key.email === 1 || index.key.phone === 1) && !expected.has(index.name)) {
      await collection.dropIndex(index.name);
    }
  }

  await collection.createIndex({ email: 1 }, { unique: true, sparse: true, name: 'user_email_unique_sparse' });
  await collection.createIndex({ phone: 1 }, { unique: true, sparse: true, name: 'user_phone_unique_sparse' });
}

export async function connectDatabase() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 10000 });
  await ensureUserContactIndexes();
  console.info('Connected to MongoDB');
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}