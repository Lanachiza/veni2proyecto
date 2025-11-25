import { getStore } from '../config/db.js';
const drivers = getStore('drivers');
if (drivers.size === 0) {
  const seed = [
    { id: 'd1', lat: 20.673, lng: -103.343, available: true },
    { id: 'd2', lat: 20.679, lng: -103.358, available: true },
    { id: 'd3', lat: 20.665, lng: -103.360, available: false }
  ];
  for (const d of seed) drivers.set(d.id, d);
}
export async function findNearestDriver(location) {
  let best = null;
  let bestD = Infinity;
  for (const d of drivers.values()) {
    if (!d.available) continue;
    const dd = distanceKm(location, { lat: d.lat, lng: d.lng });
    if (dd < bestD) {
      bestD = dd;
      best = d;
    }
  }
  return best;
}
export async function findNearbyDrivers(location, limit = 5) {
  const arr = [];
  for (const d of drivers.values()) {
    arr.push({ ...d, distanceKm: distanceKm(location, { lat: d.lat, lng: d.lng }) });
  }
  arr.sort((a, b) => a.distanceKm - b.distanceKm);
  return arr.slice(0, limit);
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

