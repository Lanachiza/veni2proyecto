import { Router } from 'express';
import { listNearbyDrivers } from '../controllers/driverController.js';
const router = Router();
router.get('/nearby', listNearbyDrivers);
export default router;

