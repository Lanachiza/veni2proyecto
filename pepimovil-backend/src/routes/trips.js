import { Router } from 'express';
import { requestTrip, acceptTrip, completeTrip, listAllTrips } from '../controllers/tripController.js';
const router = Router();
router.get('/', listAllTrips);
router.post('/request', requestTrip);
router.patch('/:id/accept', acceptTrip);
router.patch('/:id/complete', completeTrip);
export default router;
