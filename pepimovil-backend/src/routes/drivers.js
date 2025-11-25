import { Router } from 'express';
import {
  listNearbyDrivers,
  listAvailableTrips,
  acceptTripAsDriver,
  startTripAsDriver,
  completeTripAsDriver
} from '../controllers/driverController.js';
import { authMiddleware, requireDriver } from '../middlewares/auth.js';
const router = Router();

router.get('/drivers/nearby', listNearbyDrivers);
router.get('/driver/trips/available', authMiddleware, requireDriver, listAvailableTrips);
router.patch('/driver/trips/:id/accept', authMiddleware, requireDriver, acceptTripAsDriver);
router.patch('/driver/trips/:id/start', authMiddleware, requireDriver, startTripAsDriver);
router.patch('/driver/trips/:id/complete', authMiddleware, requireDriver, completeTripAsDriver);

export default router;
