import { getStore } from '../config/db.js';
const trips = getStore('trips');
export async function createTrip(trip) {
  trips.set(trip.id, { ...trip });
  return trips.get(trip.id);
}
export async function getTripById(id) {
  return trips.get(id) || null;
}
export async function updateTripStatus(id, status, extra = {}) {
  const t = trips.get(id);
  if (!t) return false;
  trips.set(id, { ...t, status, ...extra, updatedAt: new Date().toISOString() });
  return true;
}

