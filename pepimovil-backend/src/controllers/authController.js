import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, findUserByEmail } from '../repositories/userRepository.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret_change';
const SALT_ROUNDS = Number(process.env.SALT_ROUNDS || 10);

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
}

// Login basado en idToken (stub previo, se deja por compatibilidad)
export async function login(req, res, next) {
  try {
    const { idToken } = req.body || {};
    if (!idToken) {
      return res.status(400).json({ error: 'idToken is required' });
    }
    const user = {
      id: 'u-' + Buffer.from(idToken).toString('hex').slice(0, 8),
      email: 'user@example.com',
      name: 'Demo User'
    };
    return res.json({ user, session: { active: true } });
  } catch (err) {
    next(err);
  }
}

export async function registerWithPassword(req, res, next) {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' });
    }
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'user already exists' });
    }
    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await createUser({
      id,
      name: name || email.split('@')[0],
      email,
      passwordHash
    });
    const token = generateToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    console.error('register error', err);
    next(err);
  }
}

export async function loginWithPassword(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' });
    }
    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    const responseUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at
    };
    const token = generateToken(responseUser);
    res.json({ user: responseUser, token });
  } catch (err) {
    console.error('login error', err);
    next(err);
  }
}
