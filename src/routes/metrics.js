// src/routes/metrics.js
const express = require('express');
const router = express.Router();
const { User, Trip } = require('../models');
const jwt = require('jsonwebtoken');

// Middleware simple para validar JWT
function authenticateJWT(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Falta token' });
  const token = auth.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) return res.status(401).json({ error: 'Token inválido' });
    req.user = payload;
    next();
  });
}

/**
 * GET /api/metrics/summary
 * Devuelve métricas básicas de la app
 */
router.get('/summary', authenticateJWT, async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalTrips = await Trip.count();
    const activeTrips = await Trip.count({ where: { status: 'in_progress' } });
    const cancelledTrips = await Trip.count({ where: { status: 'cancelled' } });
    const completedTrips = await Trip.count({ where: { status: 'completed' } });

    const [aggregates] = await Trip.findAll({
      attributes: [
        [Trip.sequelize.fn('AVG', Trip.sequelize.col('price')), 'avg_price'],
        [Trip.sequelize.fn('AVG', Trip.sequelize.col('distance_km')), 'avg_distance_km'],
        [Trip.sequelize.fn('AVG', Trip.sequelize.col('estimated_time_min')), 'avg_time_min'],
      ],
      raw: true,
    });

    res.json({
      totalUsers,
      totalTrips,
      activeTrips,
      cancelledTrips,
      completedTrips,
      averagePrice: parseFloat(aggregates.avg_price || 0).toFixed(2),
      averageDistanceKm: parseFloat(aggregates.avg_distance_km || 0).toFixed(2),
      averageTimeMin: parseFloat(aggregates.avg_time_min || 0).toFixed(2),
    });
  } catch (err) {
    console.error('Error obteniendo métricas:', err);
    res.status(500).json({ error: 'Error al obtener métricas' });
  }
});

/**
 * GET /api/metrics/health
 * Comprueba estado general del sistema (BD, tiempo activo, etc.)
 */
router.get('/health', async (req, res) => {
  try {
    const dbStatus = await User.sequelize.query('SELECT 1 AS ok');
    res.json({
      status: 'ok',
      db: dbStatus[0][0].ok === 1 ? 'ok' : 'fail',
      uptime: process.uptime(),
      time: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error en health check:', err);
    res.status(500).json({
      status: 'error',
      db: 'down',
      error: err.message,
    });
  }
});

module.exports = router;
