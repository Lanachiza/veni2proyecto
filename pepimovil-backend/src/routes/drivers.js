import { Router } from 'express';
import {
  listNearbyDrivers,
  listAvailableTrips,
  acceptTripAsDriver
} from '../controllers/driverController.js';
import { authMiddleware, requireDriver } from '../middlewares/auth.js';
const router = Router();

router.get('/drivers/nearby', listNearbyDrivers);
router.get('/driver/trips/available', authMiddleware, requireDriver, listAvailableTrips);
router.patch('/driver/trips/:id/accept', authMiddleware, requireDriver, acceptTripAsDriver);

export default router;
