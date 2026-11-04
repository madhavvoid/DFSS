import { Router } from 'express';
import { getCurrentUser, requestVerificationCode, verifyEmailCode } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/request-code', requestVerificationCode);
router.post('/verify-code', verifyEmailCode);
router.get('/me', requireAuth, getCurrentUser);

export default router;