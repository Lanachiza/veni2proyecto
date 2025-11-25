import { Router } from 'express';
import {
  requestTrip,
  acceptTrip,
  completeTrip,
  listAllTrips,
  listMyTrips,
  listDriverTrips
} from '../controllers/tripController.js';
import { authMiddleware, requireDriver } from '../middlewares/auth.js';
const router = Router();
router.use(authMiddleware);
router.get('/', listAllTrips);
router.get('/me', listMyTrips);
router.get('/driver/me', requireDriver, listDriverTrips);
router.post('/request', requestTrip);
router.patch('/:id/accept', acceptTrip);
router.patch('/:id/complete', completeTrip);
export default router;
