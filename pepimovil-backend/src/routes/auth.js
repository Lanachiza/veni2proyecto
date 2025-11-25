import { Router } from 'express';
import {
  login,
  loginWithPassword,
  registerWithPassword
} from '../controllers/authController.js';
const router = Router();
router.post('/login', login);
// Rutas de compatibilidad para el frontend actual
router.post('/legacy/login', loginWithPassword);
router.post('/legacy/register', registerWithPassword);
export default router;
