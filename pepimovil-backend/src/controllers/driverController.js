import { findNearbyDrivers } from '../models/driver.js';
import {
  findAvailableTrips,
  assignDriver,
  findActiveTripByDriver,
  startTrip,
  completeTripDriver
} from '../repositories/tripRepository.js';
export async function listNearbyDrivers(req, res, next) {
  try {
    const { lat, lng, limit = 5 } = req.query;
    if (lat == null || lng == null) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }
    const drivers = await findNearbyDrivers(
      { lat: Number(lat), lng: Number(lng) },
      Number(limit)
    );
    res.json({ drivers });
  } catch (err) {
    next(err);
  }
}

export async function listAvailableTrips(req, res, next) {
  try {
    const trips = await findAvailableTrips();
    res.json(trips);
  } catch (err) {
    next(err);
  }
}

export async function acceptTripAsDriver(req, res, next) {
  try {
    const { id } = req.params;
    const driverId = req.user?.id;
    const active = await findActiveTripByDriver(driverId);
    if (active) return res.status(409).json({ error: 'Ya tienes un viaje activo' });
    const trip = await assignDriver({ tripId: id, driverId });
    if (!trip) return res.status(404).json({ error: 'Viaje no disponible' });
    res.json(trip);
  } catch (err) {
    next(err);
  }
}

export async function startTripAsDriver(req, res, next) {
  try {
    const { id } = req.params;
    const driverId = req.user?.id;
    const trip = await startTrip({ tripId: id, driverId });
    if (!trip) return res.status(404).json({ error: 'Viaje no disponible' });
    res.json(trip);
  } catch (err) {
    next(err);
  }
}

export async function completeTripAsDriver(req, res, next) {
  try {
    const { id } = req.params;
    const driverId = req.user?.id;
    const trip = await completeTripDriver({ tripId: id, driverId });
    if (!trip) return res.status(404).json({ error: 'Viaje no disponible' });
    res.json(trip);
  } catch (err) {
    next(err);
  }
}
