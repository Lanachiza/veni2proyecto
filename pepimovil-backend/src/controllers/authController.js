import { v4 as uuidv4 } from 'uuid';
import { upsertUser, findUserByEmail } from '../models/user.js';

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
      return res.status(400).json({ error: 'user already exists' });
    }
    const user = {
      id: uuidv4(),
      email,
      name: name || email.split('@')[0],
      password // Nota: solo para demo; no usar en producción.
    };
    await upsertUser(user);
    const token = Buffer.from(user.id).toString('base64');
    res.status(201).json({ user: sanitizeUser(user), token });
  } catch (err) {
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
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'invalid credentials' });
    }
    const token = Buffer.from(user.id).toString('base64');
    res.json({ user: sanitizeUser(user), token });
  } catch (err) {
    next(err);
  }
}

function sanitizeUser(user) {
  const { password, ...rest } = user;
  return rest;
}
