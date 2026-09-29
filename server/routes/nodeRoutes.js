import { Router } from 'express';
import { getNodes, heartbeat, rebalance, register } from '../controllers/nodeController.js';
import { requireAuth, requireNodeSecret } from '../middleware/auth.js';

const router = Router();

router.post('/register', requireNodeSecret, register);
router.post('/:nodeId/heartbeat', requireNodeSecret, heartbeat);
router.get('/', requireAuth, getNodes);
router.post('/admin/rebalance', requireAuth, rebalance);

export default router;