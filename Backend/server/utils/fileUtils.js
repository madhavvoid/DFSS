import path from 'node:path';
import { mkdir, rm } from 'node:fs/promises';
import os from 'node:os';

export const uploadDirectory = path.join(os.tmpdir(), 'dfss-uploads');

export function safeFileName(name) {
  const baseName = path.basename(String(name ?? 'file')).replace(/[\r\n"\\]/g, '_');
  return baseName.slice(0, 255) || 'file';
}

export async function ensureUploadDirectory() {
  await mkdir(uploadDirectory, { recursive: true });
}

export async function removeTemporaryFile(filePath) {
  if (filePath) await rm(filePath, { force: true });
}