import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { config } from '../config/env.js';
import { uploadDirectory } from '../utils/fileUtils.js';
import { requireAuth } from '../middleware/auth.js';
import { deleteFile, downloadFile, getFile, getFileStatus, listFiles, uploadFile } from '../controllers/fileController.js';

const router = Router();
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (req, file, callback) => callback(null, randomUUID())
  }),
  limits: { fileSize: config.maxFileSizeBytes, files: 1 }
});

router.use(requireAuth);
router.get('/', listFiles);
router.post('/upload', upload.single('file'), uploadFile);
router.get('/:fileId/status', getFileStatus);
router.get('/:fileId/download', downloadFile);
router.get('/:fileId', getFile);
router.delete('/:fileId', deleteFile);

export default router;