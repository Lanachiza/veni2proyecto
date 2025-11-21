import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { assignServer } from '../services/balanceador.js';
import { isHeavyRoute } from '../services/routeService.js';
import { notifyDriverAssignment } from '../services/notificationService.js';
import { findNearestDriver } from '../models/driver.js';
import {
  createTrip as createTripDb,
  getTripById,
  updateTripStatus,
  listTrips
} from '../repositories/tripRepository.js';
import { createUser, findUserById } from '../repositories/userRepository.js';

const GUEST_SALT = 6;

function ensureUuid(id) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id || '')) return id;
  return uuidv4();
}

async function ensureUserId(rawId) {
  const candidate = ensureUuid(rawId);
  if (rawId && candidate === rawId) {
    const exists = await findUserById(candidate);
    if (exists) return candidate;
  }
  const id = uuidv4();
  const email = `guest+${Date.now()}@veni.local`;
  const name = 'Guest';
  const passwordHash = await bcrypt.hash('guest', GUEST_SALT);
  const user = await createUser({ id, name, email, passwordHash });
  return user.id;
}

function distanceKmArray(originArr, destinationArr) {
  const a = { lat: originArr[0], lng: originArr[1] };
  const b = { lat: destinationArr[0], lng: destinationArr[1] };
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
function demoFareKm(km) {
  const base = 20;
  const perKm = 7;
  return Math.round((base + km * perKm) * 100) / 100;
}

export async function requestTrip(req, res, next) {
  try {
    const { origin, destination } = req.body || {};
    const userId = await ensureUserId(req.user?.id);
    if (!userId || !origin || !destination) {
      return res.status(400).json({ error: 'user_id, origin, destination required' });
    }
    const heavy = isHeavyRoute(origin, destination);
    const assignedServer = assignServer({
      userLocation: { lat: origin[0], lng: origin[1] },
      requestType: heavy ? 'heavy' : 'light',
      priority: 'normal'
    });
    const id = uuidv4();
    const distanceKm = distanceKmArray(origin, destination);
    const price = demoFareKm(distanceKm);
    const trip = await createTripDb({
      id,
      userId,
      origin,
      destination,
      status: 'pending',
      distanceKm,
      price
    });
    const result = await getTripById(id);
    res.status(201).json({ trip: { ...result, assignedServer } });
  } catch (err) {
    next(err);
  }
}

export async function listAllTrips(req, res, next) {
  try {
    const trips = await listTrips();
    res.json(trips);
  } catch (err) {
    next(err);
  }
}

// Compatibilidad: acepta payload del frontend (origin/destination como objetos) y endpoint /api/trips
export async function requestTripFromWeb(req, res, next) {
  try {
    const { origin, destination } = req.body || {};
    if (!origin || !destination || origin.lat == null || origin.lng == null || destination.lat == null || destination.lng == null) {
      return res.status(400).json({ error: 'origin {lat,lng} y destination {lat,lng} requeridos' });
    }
    const originArr = [Number(origin.lat), Number(origin.lng)];
    const destinationArr = [Number(destination.lat), Number(destination.lng)];
    const userId = await ensureUserId(req.user?.id);

    const heavy = isHeavyRoute(originArr, destinationArr);
    const assignedServer = assignServer({
      userLocation: { lat: originArr[0], lng: originArr[1] },
      requestType: heavy ? 'heavy' : 'light',
      priority: 'normal'
    });
    const id = uuidv4();
    const distanceKm = distanceKmArray(originArr, destinationArr);
    const price = demoFareKm(distanceKm);
    await createTripDb({
      id,
      userId,
      origin: originArr,
      destination: destinationArr,
      status: 'pending',
      distanceKm,
      price
    });
    const result = await getTripById(id);
    res.status(201).json({ trip: { ...result, assignedServer } });
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
    res.json({ trip: updated });
  } catch (err) {
    next(err);
  }
}
export async function completeTrip(req, res, next) {
  try {
    const { id } = req.params;
    const trip = await getTripById(id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    const distanceKm = trip.distance_km || distanceKmArray(trip.origin, trip.destination);
    const price = demoFareKm(distanceKm);
    const updated = await updateTripStatus(id, 'completed', { distanceKm, price });
    res.json({ trip: updated });
  } catch (err) {
    next(err);
  }
}
