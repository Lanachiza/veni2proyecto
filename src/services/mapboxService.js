// src/services/mapboxService.js
const axios = require('axios');

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;
if (!MAPBOX_TOKEN) {
  console.warn('⚠️  MAPBOX_TOKEN no definido en .env. Las rutas no funcionarán sin él.');
}

const MAPBOX_BASE_URL = 'https://api.mapbox.com/directions/v5/mapbox/driving';

/**
 * Obtiene la ruta óptima entre dos coordenadas usando la API de Mapbox.
 * @param {object} origin - { lat: number, lng: number }
 * @param {object} destination - { lat: number, lng: number }
 * @returns {Promise<{distanceKm:number, durationMin:number, geometry:any}>}
 */
async function getRoute(origin, destination) {
  try {
    if (!origin || !destination) {
      throw new Error('Origen y destino son requeridos');
    }

    const url = `${MAPBOX_BASE_URL}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
    const params = {
      access_token: MAPBOX_TOKEN,
      geometries: 'geojson',
      overview: 'full',
      alternatives: false,
      steps: false,
    };

    const response = await axios.get(url, { params });

    const data = response.data;
    if (!data.routes || data.routes.length === 0) {
      throw new Error('No se encontraron rutas');
    }

    const route = data.routes[0];
    const distanceKm = route.distance / 1000;
    const durationMin = route.duration / 60;

    return {
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      durationMin: parseFloat(durationMin.toFixed(1)),
      geometry: route.geometry,
    };
  } catch (err) {
    console.error('Error en Mapbox Service:', err.message);
    throw new Error('No se pudo obtener la ruta desde Mapbox');
  }
}

/**
 * Calcula precio estimado del viaje en función de la distancia y duración.
 * Puedes ajustar los parámetros según tu modelo de negocio.
 * @param {number} distanceKm
 * @param {number} durationMin
 * @returns {number} precio estimado
 */
function estimatePrice(distanceKm, durationMin) {
  const baseFare = 25; // tarifa base
  const costPerKm = 8; // costo por kilómetro
  const costPerMin = 2; // costo por minuto
  const total = baseFare + distanceKm * costPerKm + durationMin * costPerMin;
  return parseFloat(total.toFixed(2));
}

module.exports = {
  getRoute,
  estimatePrice,
};
