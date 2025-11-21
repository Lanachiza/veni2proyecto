import { Router } from 'express';
import { getMe, updateMe } from '../controllers/userController.js';

const router = Router();
router.get('/me', getMe);
router.patch('/me', updateMe);

export default router;
