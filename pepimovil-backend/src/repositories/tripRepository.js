import { db } from '../config/db.js';

function mapTrip(row) {
  if (!row) return null;
  return {
    id: row.id,
    user_id: row.user_id,
    driver_id: row.driver_id,
    origin: [row.origin_lat, row.origin_lng],
    destination: [row.dest_lat, row.dest_lng],
    status: row.status,
    distance_km: row.distance_km,
    price: row.price,
    createdAt: row.created_at,
    created_at: row.created_at,
    updatedAt: row.updated_at,
    updated_at: row.updated_at
  };
}

export async function createTrip({ id, userId, origin, destination, status, distanceKm, price, driverId = null }) {
  const query = `
    INSERT INTO trips (
      id, user_id, driver_id,
      origin_lat, origin_lng,
      dest_lat, dest_lng,
      status, distance_km, price
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING *
  `;
  const params = [
    id,
    userId,
    driverId,
    origin[0],
    origin[1],
    destination[0],
    destination[1],
    status || 'pending',
    distanceKm ?? null,
    price ?? null
  ];
  const { rows } = await db.query(query, params);
  return mapTrip(rows[0]);
}

export async function getTripById(id) {
  const { rows } = await db.query('SELECT * FROM trips WHERE id = $1 LIMIT 1', [id]);
  return mapTrip(rows[0]);
}

export async function listTrips() {
  const { rows } = await db.query('SELECT * FROM trips ORDER BY created_at DESC');
  return rows.map(mapTrip);
}

export async function getTripsByUser(userId) {
  const { rows } = await db.query(
    'SELECT * FROM trips WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return rows.map(mapTrip);
}

export async function updateTripStatus(id, status, extra = {}) {
  const { distanceKm, price, driverId } = extra;
  const query = `
    UPDATE trips
    SET status = $2,
        distance_km = COALESCE($3, distance_km),
        price = COALESCE($4, price),
        driver_id = COALESCE($5, driver_id),
        updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `;
  const params = [id, status, distanceKm ?? null, price ?? null, driverId ?? null];
  const { rows } = await db.query(query, params);
  return mapTrip(rows[0]);
}

export async function countTrips() {
  const { rows } = await db.query('SELECT COUNT(*)::int AS total FROM trips');
  return rows[0]?.total || 0;
}

export async function findAvailableTrips() {
  const { rows } = await db.query(
    `SELECT * FROM trips
     WHERE status IN ('created', 'pending') AND driver_id IS NULL
     ORDER BY created_at ASC`
  );
  return rows.map(mapTrip);
}

export async function assignDriver({ tripId, driverId }) {
  const query = `
    UPDATE trips
    SET driver_id = $2,
        status = 'accepted',
        updated_at = NOW()
    WHERE id = $1 AND driver_id IS NULL
    RETURNING *
  `;
  const { rows } = await db.query(query, [tripId, driverId]);
  return mapTrip(rows[0]);
}
