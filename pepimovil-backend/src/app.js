import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/auth.js';
import tripRoutes from './routes/trips.js';
import driverRoutes from './routes/drivers.js';
import userRoutes from './routes/users.js';
import { loginWithPassword, registerWithPassword } from './controllers/authController.js';
import { requestTripFromWeb } from './controllers/tripController.js';
import { getStore } from './config/db.js';
import { countUsers } from './repositories/userRepository.js';
import { countTrips } from './repositories/tripRepository.js';
const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Endpoints de compatibilidad con el frontend existente
app.post('/api/login', loginWithPassword);
app.post('/api/register', registerWithPassword);
app.post('/api/trips', requestTripFromWeb);
app.get('/api/metrics/summary', async (req, res, next) => {
  try {
    const users = await countUsers();
    const trips = await countTrips();
    res.json({ users, trips });
  } catch (err) {
    next(err);
  }
});
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/users', userRoutes);
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});
export default app;
