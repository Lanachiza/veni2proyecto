import { Router } from 'express';
import { requestTrip, acceptTrip, completeTrip } from '../controllers/tripController.js';
const router = Router();
router.post('/request', requestTrip);
router.patch('/:id/accept', acceptTrip);
router.patch('/:id/complete', completeTrip);
export default router;

