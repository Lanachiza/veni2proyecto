function parseServersFromEnv() {
  const raw = process.env.BALANCER_SERVERS || '';
  if (!raw) return [];
  return raw.split(',').map((s) => {
    const [name, lat, lng, load, latencyMs, hasGpu] = s.split(':');
    return {
      name,
      lat: Number(lat),
      lng: Number(lng),
      load: Number(load),
      latencyMs: Number(latencyMs),
      hasGpu: String(hasGpu).toLowerCase() === 'true'
    };
  });
}
const defaultServers = [
  { name: 'api-a', lat: 20.6736, lng: -103.344, load: 0.35, latencyMs: 30, hasGpu: false },
  { name: 'api-b', lat: 20.6789, lng: -103.355, load: 0.55, latencyMs: 45, hasGpu: true },
  { name: 'api-c', lat: 20.66, lng: -103.36, load: 0.20, latencyMs: 25, hasGpu: false }
];
function haversineKm(a, b) {
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
export function assignServer({ userLocation, requestType = 'light', priority = 'normal' }) {
  const servers = parseServersFromEnv();
  const pool = servers.length ? servers : defaultServers;
  let candidates = pool.filter((s) => s.load < 0.8);
  if (requestType === 'heavy') {
    const gpuNodes = candidates.filter((s) => s.hasGpu);
    if (gpuNodes.length) candidates = gpuNodes;
  }
  let best = null;
  let bestScore = Infinity;
  for (const s of candidates) {
    const dKm = haversineKm(userLocation, { lat: s.lat, lng: s.lng });
    const loadPenalty = s.load * 100;
    const latPenalty = Math.max(0, s.latencyMs - 10) * 0.5;
    let score = dKm + loadPenalty + latPenalty;
    if (priority === 'high') score *= 0.9;
    if (score < bestScore) {
      bestScore = score;
      best = s;
    }
  }
  return best || pool[0];
}

