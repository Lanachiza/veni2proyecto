import { findNearbyDrivers } from '../models/driver.js';
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

