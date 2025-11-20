import { v4 as uuidv4 } from 'uuid';
import { createTrip, getTripById, updateTripStatus } from '../models/trip.js';
import { assignServer } from '../services/balanceador.js';
import { isHeavyRoute } from '../services/routeService.js';
import { notifyDriverAssignment } from '../services/notificationService.js';
import { findNearestDriver } from '../models/driver.js';
export async function requestTrip(req, res, next) {
  try {
    const { user_id, origin, destination } = req.body || {};
    if (!user_id || !origin || !destination) {
      return res.status(400).json({ error: 'user_id, origin, destination required' });
    }
    const heavy = isHeavyRoute(origin, destination);
    const assignedServer = assignServer({
      userLocation: { lat: origin[0], lng: origin[1] },
      requestType: heavy ? 'heavy' : 'light',
      priority: 'normal'
    });
    const id = uuidv4();
    const trip = await createTrip({
      id,
      user_id,
      origin,
      destination,
      status: 'pending',
      assignedServer,
      createdAt: new Date().toISOString()
    });
    const driver = await findNearestDriver({ lat: origin[0], lng: origin[1] });
    if (driver) {
      await updateTripStatus(id, 'accepted', { driver_id: driver.id });
      await notifyDriverAssignment(driver, trip);
    }
    const result = await getTripById(id);
    res.status(201).json({ trip: result });
  } catch (err) {
    next(err);
  }
}

// Compatibilidad: acepta payload del frontend (origin/destination como objetos) y endpoint /api/trips
export async function requestTripFromWeb(req, res, next) {
  try {
    const { user_id, origin, destination } = req.body || {};
    if (!origin || !destination || origin.lat == null || origin.lng == null || destination.lat == null || destination.lng == null) {
      return res.status(400).json({ error: 'origin {lat,lng} y destination {lat,lng} requeridos' });
    }
    const originArr = [Number(origin.lat), Number(origin.lng)];
    const destinationArr = [Number(destination.lat), Number(destination.lng)];
    const userId = user_id || 'web-user';

    const heavy = isHeavyRoute(originArr, destinationArr);
    const assignedServer = assignServer({
      userLocation: { lat: originArr[0], lng: originArr[1] },
      requestType: heavy ? 'heavy' : 'light',
      priority: 'normal'
    });
    const id = uuidv4();
    const trip = await createTrip({
      id,
      user_id: userId,
      origin: originArr,
      destination: destinationArr,
      status: 'pending',
      assignedServer,
      createdAt: new Date().toISOString()
    });
    const driver = await findNearestDriver({ lat: originArr[0], lng: originArr[1] });
    if (driver) {
      await updateTripStatus(id, 'accepted', { driver_id: driver.id });
      await notifyDriverAssignment(driver, trip);
    }
    const result = await getTripById(id);
    res.status(201).json({ trip: result });
  } catch (err) {
    next(err);
  }
}
export async function acceptTrip(req, res, next) {
  try {
    const { id } = req.params;
    const { driver_id } = req.body || {};
    if (!driver_id) return res.status(400).json({ error: 'driver_id required' });
    const updated = await updateTripStatus(id, 'active', { driver_id });
    if (!updated) return res.status(404).json({ error: 'Trip not found' });
    res.json({ trip: await getTripById(id) });
  } catch (err) {
    next(err);
  }
}
export async function completeTrip(req, res, next) {
  try {
    const { id } = req.params;
    const updated = await updateTripStatus(id, 'completed');
    if (!updated) return res.status(404).json({ error: 'Trip not found' });
    const trip = await getTripById(id);
    const fare = demoFare(trip.origin, trip.destination);
    res.json({ trip: { ...trip, fare } });
  } catch (err) {
    next(err);
  }
}
function demoFare(origin, destination) {
  const d = distanceKm(
    { lat: origin[0], lng: origin[1] },
    { lat: destination[0], lng: destination[1] }
  );
  const base = 20;
  const perKm = 7;
  return Math.round((base + d * perKm) * 100) / 100;
}
function distanceKm(a, b) {
  const R = 6371;
  const dLat = deg2rad(b.lat - a.lat);
  const dLon = deg2rad(b.lng - a.lng);
  const lat1 = deg2rad(a.lat);
  const lat2 = deg2rad(b.lat);
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}
function deg2rad(d) {
  return (d * Math.PI) / 180;
}
