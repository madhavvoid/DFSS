import { Router } from 'express';
import { listUploads, listUsers } from '../controllers/adminController.js';
import { downloadAdminFile } from '../controllers/fileController.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireAdmin);
router.get('/users', listUsers);
router.get('/uploads', listUploads);
router.get('/uploads/:fileId/download', downloadAdminFile);

export default router;