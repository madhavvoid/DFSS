import jwt from 'jsonwebtoken';
import { timingSafeEqual } from 'node:crypto';
import { config } from '../config/env.js';

export function requireAuth(req, res, next) {
  const authorization = req.get('authorization') ?? '';
  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { id: payload.sub, email: payload.email };
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireNodeSecret(req, res, next) {
  const provided = Buffer.from(req.get('x-node-token') ?? '');
  const expected = Buffer.from(config.nodeSharedSecret);
  if (!expected.length || provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return res.status(401).json({ error: 'Invalid storage-node credentials' });
  }
  return next();
}