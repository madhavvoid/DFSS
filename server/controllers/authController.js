import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { config } from '../config/env.js';
import { ApiError } from '../middleware/errorHandler.js';

function createToken(user) {
  return jwt.sign({ email: user.email }, config.jwtSecret, {
    subject: user._id.toString(),
    expiresIn: config.jwtExpiresIn
  });
}

function publicUser(user) {
  return { id: user._id.toString(), name: user.name, email: user.email };
}

export async function register(req, res) {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = req.body.password;
  if (name.length < 1 || name.length > 100) throw new ApiError(400, 'Name must be between 1 and 100 characters');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new ApiError(400, 'Enter a valid email address');
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    throw new ApiError(400, 'Password must be between 8 and 128 characters');
  }

  if (await User.exists({ email })) throw new ApiError(409, 'An account with this email already exists');
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
  return res.status(201).json({ token: createToken(user), user: publicUser(user) });
}

export async function login(req, res) {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = req.body.password;
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || typeof password !== 'string' || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  return res.json({ token: createToken(user), user: publicUser(user) });
}

export async function getCurrentUser(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(401, 'Account no longer exists');
  return res.json({ user: publicUser(user) });
}