import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { config } from '../config/env.js';
import { ApiError } from '../middleware/errorHandler.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const bcryptSaltRounds = 12;

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function normalizePhone(value) {
  return typeof value === 'string' ? value.trim().replace(/[\s().-]/g, '') : '';
}

function validatePassword(value) {
  if (typeof value !== 'string' || value.length < 8 || Buffer.byteLength(value, 'utf8') > 72) {
    throw new ApiError(400, 'Password must be at least 8 characters and no more than 72 bytes');
  }
  return value;
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email || null,
    phone: user.phone || null
  };
}

function createSession(user) {
  const token = jwt.sign({ email: user.email }, config.jwtSecret, {
    subject: user._id.toString(),
    expiresIn: config.jwtExpiresIn
  });
  return { token, user: publicUser(user) };
}

export async function register(req, res) {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const email = normalizeEmail(req.body.email);
  const password = validatePassword(req.body.password);
  const phone = normalizePhone(req.body.phone);

  if (!name || name.length > 100) {
    throw new ApiError(400, 'Name must be between 1 and 100 characters');
  }
  if (!emailPattern.test(email) || email.length > 254) {
    throw new ApiError(400, 'Enter a valid email address');
  }
  if (phone && !/^\+?[1-9]\d{6,14}$/.test(phone)) {
    throw new ApiError(400, 'Enter a valid phone number with country code');
  }

  let user;
  try {
    user = await User.create({
      name,
      email,
      phone: phone || undefined,
      passwordHash: await bcrypt.hash(password, bcryptSaltRounds)
    });
  } catch (error) {
    if (error.code === 11000) throw new ApiError(409, 'An account with this email or phone number already exists');
    throw error;
  }

  return res.status(201).json(createSession(user));
}

export async function login(req, res) {
  const email = normalizeEmail(req.body.email);
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!emailPattern.test(email) || !password || Buffer.byteLength(password, 'utf8') > 72) {
    throw new ApiError(400, 'Enter a valid email address and password');
  }

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new ApiError(401, 'Incorrect email or password');
  }

  return res.json(createSession(user));
}

export async function getCurrentUser(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(401, 'Account no longer exists');
  return res.json({ user: publicUser(user) });
}
