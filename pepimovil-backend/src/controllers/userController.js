import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { findUserById, updateUser } from '../repositories/userRepository.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret_change';
const SALT_ROUNDS = Number(process.env.SALT_ROUNDS || 10);

function getUserIdFromAuth(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload.id;
  } catch (err) {
    return null;
  }
}

export async function getMe(req, res, next) {
  try {
    const userId = getUserIdFromAuth(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const user = await findUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req, res, next) {
  try {
    const userId = getUserIdFromAuth(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const { name, email, password } = req.body || {};
    if (!name && !email && !password) {
      return res.status(400).json({ error: 'Nothing to update' });
    }
    const passwordHash = password ? await bcrypt.hash(password, SALT_ROUNDS) : undefined;
    const updated = await updateUser({ id: userId, name, email, passwordHash });
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json({ user: updated });
  } catch (err) {
    next(err);
  }
}
