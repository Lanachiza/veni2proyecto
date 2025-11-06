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

