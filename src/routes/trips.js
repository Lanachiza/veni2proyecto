// src/routes/trips.js
const express = require('express');
const router = express.Router();
const { Trip, User } = require('../models');
const jwt = require('jsonwebtoken');

// Middleware de autenticación JWT
function authenticateJWT(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer '))
    return res.status(401).json({ error: 'Falta token' });

  const token = auth.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) return res.status(401).json({ error: 'Token inválido' });
    req.user = payload;
    next();
  });
}

/**
 * POST /api/trips
 * Crea un nuevo viaje
 * body: { origin: {lat, lng}, destination: {lat, lng}, price, estimatedTimeMin, distanceKm }
 */
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { origin, destination, price, estimatedTimeMin, distanceKm } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ error: 'Faltan coordenadas de origen o destino' });
    }

    const newTrip = await Trip.create({
      userId: req.user.userId,
      origin: { type: 'Point', coordinates: [origin.lng, origin.lat] },
      destination: { type: 'Point', coordinates: [destination.lng, destination.lat] },
      status: 'requested',
      price,
      estimatedTimeMin,
      distanceKm,
    });

    res.status(201).json(newTrip);
  } catch (err) {
    console.error('Error al crear viaje:', err);
    res.status(500).json({ error: 'No se pudo crear el viaje' });
  }
});

/**
 * GET /api/trips
 * Lista los viajes del usuario autenticado
 */
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const trips = await Trip.findAll({
      where: { userId: req.user.userId },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
    res.json(trips);
  } catch (err) {
    console.error('Error al listar viajes:', err);
    res.status(500).json({ error: 'No se pudieron obtener los viajes' });
  }
});

/**
 * GET /api/trips/:id
 * Consulta un viaje por su ID
 */
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const trip = await Trip.findByPk(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Viaje no encontrado' });

    if (trip.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Acceso denegado a este viaje' });
    }

    res.json(trip);
  } catch (err) {
    console.error('Error al obtener viaje:', err);
    res.status(500).json({ error: 'No se pudo obtener el viaje' });
  }
});

/**
 * PUT /api/trips/:id
 * Actualiza estado del viaje (ej. assigned, in_progress, completed, cancelled)
 * body: { status }
 */
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['requested', 'assigned', 'in_progress', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Estado no válido' });
    }

    const trip = await Trip.findByPk(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Viaje no encontrado' });

    if (trip.userId !== req.user.userId) {
      return res.status(403).json({ error: 'No puedes modificar este viaje' });
    }

    trip.status = status;
    await trip.save();

    res.json({ message: 'Estado actualizado', trip });
  } catch (err) {
    console.error('Error al actualizar viaje:', err);
    res.status(500).json({ error: 'No se pudo actualizar el viaje' });
  }
});

/**
 * DELETE /api/trips/:id
 * Cancela un viaje
 */
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const trip = await Trip.findByPk(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Viaje no encontrado' });

    if (trip.userId !== req.user.userId) {
      return res.status(403).json({ error: 'No puedes eliminar este viaje' });
    }

    trip.status = 'cancelled';
    await trip.save();

    res.json({ message: 'Viaje cancelado correctamente', trip });
  } catch (err) {
    console.error('Error al cancelar viaje:', err);
    res.status(500).json({ error: 'No se pudo cancelar el viaje' });
  }
});

module.exports = router;
