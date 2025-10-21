// src/services/recommendationService.js
const { Trip } = require('../models');
const { getRoute, estimatePrice } = require('./mapboxService');
const AWS = require('aws-sdk');

const sagemakerRuntime = new AWS.SageMakerRuntime({
  region: process.env.AWS_REGION || 'us-east-1',
});

/**
 * Sugerir destino basado en el historial del usuario
 * @param {string} userId
 * @returns {Promise<object|null>} { lat, lng, frecuencia }
 */
async function suggestDestination(userId) {
  try {
    const trips = await Trip.findAll({
      where: { userId },
      attributes: ['destination'],
      limit: 100,
    });

    if (trips.length === 0) return null;

    // Contar destinos más frecuentes
    const counts = {};
    trips.forEach((t) => {
      if (!t.destination) return;
      const coords = t.destination.coordinates;
      const key = `${coords[1].toFixed(3)},${coords[0].toFixed(3)}`; // lat,lng
      counts[key] = (counts[key] || 0) + 1;
    });

    // Elegir el destino con mayor frecuencia
    const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (!best) return null;

    const [lat, lng] = best[0].split(',').map(Number);
    return { lat, lng, frecuencia: best[1] };
  } catch (err) {
    console.error('Error en suggestDestination:', err);
    return null;
  }
}

/**
 * Obtener recomendación de ruta óptima desde SageMaker (si existe endpoint)
 * @param {object} origin {lat,lng}
 * @param {object} destination {lat,lng}
 * @returns {Promise<object|null>}
 */
async function getRecommendedRouteFromSageMaker(origin, destination) {
  if (!process.env.SAGEMAKER_ENDPOINT_NAME) return null;

  try {
    const response = await sagemakerRuntime
      .invokeEndpoint({
        EndpointName: process.env.SAGEMAKER_ENDPOINT_NAME,
        Body: JSON.stringify({ origin, destination }),
        ContentType: 'application/json',
      })
      .promise();

    const body = JSON.parse(new TextDecoder('utf-8').decode(response.Body));
    return body; // podría incluir ruta alternativa, tráfico, predicciones de demanda, etc.
  } catch (err) {
    console.error('Error llamando a SageMaker:', err.message);
    return null;
  }
}

/**
 * Sugerir ruta óptima combinando heurística local y SageMaker
 * @param {object} origin {lat,lng}
 * @param {object} destination {lat,lng}
 * @returns {Promise<object>} { distanceKm, durationMin, price, geometry, modelUsed }
 */
async function suggestOptimalRoute(origin, destination) {
  try {
    // 1️⃣ Intentar con modelo ML si existe
    const aiSuggestion = await getRecommendedRouteFromSageMaker(origin, destination);
    if (aiSuggestion && aiSuggestion.distanceKm && aiSuggestion.durationMin) {
      return {
        ...aiSuggestion,
        modelUsed: 'sagemaker',
      };
    }

    // 2️⃣ Si no hay modelo ML, usar Mapbox Directions
    const { distanceKm, durationMin, geometry } = await getRoute(origin, destination);
    const price = estimatePrice(distanceKm, durationMin);

    return {
      distanceKm,
      durationMin,
      price,
      geometry,
      modelUsed: 'heuristic',
    };
  } catch (err) {
    console.error('Error al sugerir ruta:', err);
    throw new Error('No se pudo generar recomendación de ruta');
  }
}

module.exports = {
  suggestDestination,
  suggestOptimalRoute,
};
