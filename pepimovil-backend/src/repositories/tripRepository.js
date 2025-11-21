import { db } from '../config/db.js';

function mapTrip(row) {
  if (!row) return null;
  return {
    id: row.id,
    user_id: row.user_id,
    origin: [row.origin_lat, row.origin_lng],
    destination: [row.dest_lat, row.dest_lng],
    status: row.status,
    distance_km: row.distance_km,
    price: row.price,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function createTrip({ id, userId, origin, destination, status, distanceKm, price }) {
  const query = `
    INSERT INTO trips (
      id, user_id,
      origin_lat, origin_lng,
      dest_lat, dest_lng,
      status, distance_km, price
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *
  `;
  const params = [
    id,
    userId,
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
  const { distanceKm, price } = extra;
  const query = `
    UPDATE trips
    SET status = $2,
        distance_km = COALESCE($3, distance_km),
        price = COALESCE($4, price),
        updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `;
  const params = [id, status, distanceKm ?? null, price ?? null];
  const { rows } = await db.query(query, params);
  return mapTrip(rows[0]);
}

export async function countTrips() {
  const { rows } = await db.query('SELECT COUNT(*)::int AS total FROM trips');
  return rows[0]?.total || 0;
}
