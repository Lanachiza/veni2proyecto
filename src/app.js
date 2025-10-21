// src/app.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Socket.IO (WebSocket) - usable en /realtime
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});

/* ---------------------------
   Configuration / Pool DB
   --------------------------- */
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '10', 10);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // recommended: postgres://user:pass@host:port/db
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.PG_MAX_CLIENTS || '20', 10),
  idleTimeoutMillis: 30000
});

/* ---------------------------
   Middlewares
   --------------------------- */
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 600, // limit per IP per window
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', apiLimiter);

/* ---------------------------
   Helper: Auth middleware
   --------------------------- */
function authenticateJWT(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  const token = auth.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.user = payload; // { userId, email, ... }
    next();
  });
}

/* ---------------------------
   Health endpoint
   --------------------------- */
app.get('/health', async (req, res) => {
  try {
    const dbRes = await pool.query('SELECT 1 AS ok');
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      db: dbRes.rows[0].ok === 1 ? 'ok' : 'fail',
      time: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'down', error: err.message });
  }
});

/* ---------------------------
   Auth endpoints: register / login
   Simple user model assumed:
   users(id uuid, email text unique, password text, name text)
   --------------------------- */
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const id = uuidv4();

    const q = 'INSERT INTO users(id, email, password, name) VALUES($1,$2,$3,$4) RETURNING id, email, name';
    const values = [id, email.toLowerCase(), hashed, name || null];
    const result = await pool.query(q, values);

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '8h' });

    res.status(201).json({ user, token });
  } catch (err) {
    if (err.code === '23505') { // unique_violation
      return res.status(409).json({ error: 'email already registered' });
    }
    console.error('Register error:', err);
    res.status(500).json({ error: 'internal server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const q = 'SELECT id, email, password, name FROM users WHERE email = $1 LIMIT 1';
    const r = await pool.query(q, [email.toLowerCase()]);
    if (r.rowCount === 0) return res.status(401).json({ error: 'invalid credentials' });

    const user = r.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'invalid credentials' });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'internal server error' });
  }
});

/* ---------------------------
   Trips endpoints
   trips table assumed (id uuid, user_id uuid, origin geometry/point, destination geometry/point, status text, created_at timestamptz)
   For simplicity we store origin/destination as GeoJSON text (could adapt to PostGIS POINT)
   --------------------------- */

/**
 * Request a trip
 * POST /api/trips
 * body: { origin: {lat,lng}, destination: {lat,lng}, metadata: {...} }
 */
app.post('/api/trips', authenticateJWT, async (req, res) => {
  try {
    const { origin, destination, metadata } = req.body;
    if (!origin || !destination) return res.status(400).json({ error: 'origin and destination required' });

    // Example storing as GeoJSON text; if using PostGIS you would use ST_SetSRID(ST_MakePoint(...), 4326)
    const id = uuidv4();
    const q = `INSERT INTO trips(id, user_id, origin_geojson, destination_geojson, status, metadata, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, now()) RETURNING id, status, created_at`;
    const values = [
      id,
      req.user.userId,
      JSON.stringify(origin),
      JSON.stringify(destination),
      'requested',
      metadata ? JSON.stringify(metadata) : null
    ];
    const r = await pool.query(q, values);

    // Emit event to realtime channel so driver apps / monitoring can see new trip
    io.emit('trip:created', { tripId: id, userId: req.user.userId, origin, destination });

    res.status(201).json({ trip: r.rows[0] });
  } catch (err) {
    console.error('Create trip error:', err);
    res.status(500).json({ error: 'internal server error' });
  }
});

/**
 * Get trip by id
 * GET /api/trips/:id
 */
app.get('/api/trips/:id', authenticateJWT, async (req, res) => {
  try {
    const tripId = req.params.id;
    const q = 'SELECT id, user_id, origin_geojson, destination_geojson, status, metadata, created_at FROM trips WHERE id = $1 LIMIT 1';
    const r = await pool.query(q, [tripId]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'trip not found' });

    const t = r.rows[0];
    // Only owner (or admin) should access — basic check:
    if (t.user_id !== req.user.userId) return res.status(403).json({ error: 'forbidden' });

    // parse stored geojson strings
    t.origin = t.origin_geojson ? JSON.parse(t.origin_geojson) : null;
    t.destination = t.destination_geojson ? JSON.parse(t.destination_geojson) : null;
    delete t.origin_geojson; delete t.destination_geojson;

    res.json({ trip: t });
  } catch (err) {
    console.error('Get trip error:', err);
    res.status(500).json({ error: 'internal server error' });
  }
});

/* ---------------------------
   Simple admin metric endpoint (protected)
   --------------------------- */
app.get('/api/metrics/summary', authenticateJWT, async (req, res) => {
  try {
    // For class/demo - returns basic counts
    const trips = await pool.query('SELECT count(*)::int AS total_trips FROM trips');
    const users = await pool.query('SELECT count(*)::int AS total_users FROM users');
    res.json({ users: users.rows[0].total_users, trips: trips.rows[0].total_trips });
  } catch (err) {
    console.error('Metrics error:', err);
    res.status(500).json({ error: 'internal server error' });
  }
});

/* ---------------------------
   Socket.IO handlers
   --------------------------- */
io.on('connection', (socket) => {
  const id = socket.id;
  console.log(`Realtime client connected: ${id}`);

  socket.on('join', (room) => {
    socket.join(room);
  });

  socket.on('ping', (data) => socket.emit('pong', { ts: Date.now(), echo: data }));

  socket.on('disconnect', (reason) => {
    console.log(`Realtime client disconnected: ${id} (${reason})`);
  });
});

/* ---------------------------
   Graceful shutdown
   --------------------------- */
async function shutdown() {
  console.log('Shutting down server...');
  try {
    await pool.end();
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
    // force exit after timeout
    setTimeout(() => process.exit(1), 5000);
  } catch (err) {
    console.error('Error during shutdown', err);
    process.exit(1);
  }
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

/* ---------------------------
   Start server
   --------------------------- */
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT} (env=${process.env.NODE_ENV || 'dev'})`);
});
