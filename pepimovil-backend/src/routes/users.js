import { Router } from 'express';
import { getMe, updateMe } from '../controllers/userController.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();
router.use(authMiddleware);
router.get('/me', getMe);
router.patch('/me', updateMe);

export default router;
