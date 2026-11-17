import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getCurrentUser, loginWithAdminPassword, loginWithPassword, register, requestVerificationCode, resetPassword, setPassword } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const passwordLoginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 10,
	standardHeaders: 'draft-8',
	legacyHeaders: false,
	message: { error: 'Too many sign-in attempts. Try again in 15 minutes.' }
});

router.post('/register', register);
router.post('/login', passwordLoginLimiter, loginWithPassword);
router.post('/admin-login', passwordLoginLimiter, loginWithAdminPassword);
router.post('/request-code', requestVerificationCode);
router.post('/reset-password', resetPassword);
router.post('/set-password', requireAuth, setPassword);
router.get('/me', requireAuth, getCurrentUser);

export default router;