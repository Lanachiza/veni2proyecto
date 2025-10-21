// src/routes/users.js
const express = require('express');
const router = express.Router();
const { User } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// --- Middleware de autenticación JWT ---
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
 * POST /api/users/register
 * Crea un nuevo usuario
 * body: { email, password, name }
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });

    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ error: 'El correo ya está registrado' });

    const saltRounds = parseInt(process.env.SALT_ROUNDS || '10', 10);
    const hashed = await bcrypt.hash(password, saltRounds);

    const user = await User.create({ email, password: hashed, name });

    // Generar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(201).json({
      message: 'Usuario registrado correctamente',
      user: user.toJSON(),
      token,
    });
  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).json({ error: 'No se pudo registrar el usuario' });
  }
});

/**
 * POST /api/users/login
 * Inicia sesión
 * body: { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Faltan credenciales' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ message: 'Inicio de sesión exitoso', user: user.toJSON(), token });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

/**
 * GET /api/users/profile
 * Obtiene el perfil del usuario autenticado
 */
router.get('/profile', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: ['id', 'email', 'name', 'role', 'createdAt'],
    });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json(user);
  } catch (err) {
    console.error('Error al obtener perfil:', err);
    res.status(500).json({ error: 'No se pudo obtener el perfil' });
  }
});

/**
 * PUT /api/users/profile
 * Actualiza nombre o contraseña del usuario autenticado
 * body: { name?, password? }
 */
router.put('/profile', authenticateJWT, async (req, res) => {
  try {
    const { name, password } = req.body;
    const user = await User.findByPk(req.user.userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (name) user.name = name;
    if (password) {
      const saltRounds = parseInt(process.env.SALT_ROUNDS || '10', 10);
      user.password = await bcrypt.hash(password, saltRounds);
    }

    await user.save();
    res.json({ message: 'Perfil actualizado correctamente', user: user.toJSON() });
  } catch (err) {
    console.error('Error al actualizar perfil:', err);
    res.status(500).json({ error: 'No se pudo actualizar el perfil' });
  }
});

/**
 * GET /api/users
 * (Solo admin) Lista todos los usuarios registrados
 */
router.get('/', authenticateJWT, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ error: 'No autorizado' });

    const users = await User.findAll({
      attributes: ['id', 'email', 'name', 'role', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });

    res.json(users);
  } catch (err) {
    console.error('Error al listar usuarios:', err);
    res.status(500).json({ error: 'No se pudieron obtener los usuarios' });
  }
});

module.exports = router;
