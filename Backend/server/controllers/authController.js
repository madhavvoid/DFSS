import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import VerificationChallenge from '../models/VerificationChallenge.js';
import User from '../models/User.js';
import { config } from '../config/env.js';
import { ApiError } from '../middleware/errorHandler.js';
import { sendVerificationCode } from '../services/emailService.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRounds = 12;

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function normalizePhone(value) {
  return typeof value === 'string' ? value.trim().replace(/[\s().-]/g, '') : '';
}

function validatePhone(phone) {
  if (!/^\+?[1-9]\d{6,14}$/.test(phone)) {
    throw new ApiError(400, 'Enter a valid phone number with country code');
  }
}

function codeDigest(code) {
  return createHmac('sha256', config.jwtSecret).update(code).digest('hex');
}

function maskEmail(email) {
  const [name, domain] = email.split('@');
  return `${name.slice(0, 1)}${'*'.repeat(Math.max(2, name.length - 1))}@${domain}`;
}

function accountKey(contact) {
  return contact.email ? `email:${contact.email}` : `phone:${contact.phone}`;
}

function signupDetails(body) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = normalizeEmail(body.email);
  const phone = normalizePhone(body.phone);
  if (name.length < 1 || name.length > 100) throw new ApiError(400, 'Name must be between 1 and 100 characters');
  if (email && (!emailPattern.test(email) || email.length > 254)) throw new ApiError(400, 'Enter a valid email address');
  if (phone) validatePhone(phone);
  if (!email) throw new ApiError(400, 'Enter an email address to create an account');
  return { name, email: email || undefined, phone: phone || undefined };
}

function validatePassword(password, optional = false) {
  if (optional && (password === undefined || password === '')) return null;
  if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new ApiError(400, 'Password must be at least 8 characters and no more than 72 UTF-8 bytes');
  }
  return password;
}

function verificationToken(user) {
  return { token: createToken(user), user: publicUser(user) };
}

function createToken(user) {
  return jwt.sign({ email: user.email }, config.jwtSecret, {
    subject: user._id.toString(),
    expiresIn: config.jwtExpiresIn
  });
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email || null,
    phone: user.phone || null,
    lastLoginAt: user.lastLoginAt || null,
    hasPassword: Boolean(user.passwordHash),
    isAdmin: config.adminEmails.includes(user.email?.toLowerCase())
  };
}

export async function requestVerificationCode(req, res) {
  if (req.body.intent !== 'password-reset') throw new ApiError(400, 'Only password recovery codes are supported');
  const email = normalizeEmail(req.body.identifier);
  if (!emailPattern.test(email)) throw new ApiError(400, 'Enter a valid email address');
  const user = await User.findOne({ email });
  if (!user) {
    return res.json({
      message: 'If an account exists, a password recovery code has been sent.',
      destination: maskEmail(email)
    });
  }
  const key = accountKey(user);

  const existingCode = await VerificationChallenge.findOne({ accountKey: key });
  if (existingCode && Date.now() - existingCode.sentAt.getTime() < 60_000) {
    throw new ApiError(429, 'Please wait a minute before requesting another code');
  }

  const code = String(randomInt(100000, 1000000));
  const sentAt = new Date();
  await VerificationChallenge.findOneAndUpdate(
    { accountKey: key },
    { codeDigest: codeDigest(code), intent: 'password-reset', channel: 'email', sentAt, expiresAt: new Date(sentAt.getTime() + 10 * 60_000), attempts: 0 },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const useDevelopmentCode = config.developmentAuthCodes;
  if (!useDevelopmentCode) {
    try {
      await sendVerificationCode({ email, code, channel: 'email' });
    } catch (error) {
      await VerificationChallenge.deleteOne({ accountKey: key });
      throw error;
    }
  }

  const destination = maskEmail(email);
  return res.json({
    message: useDevelopmentCode
      ? 'Local development verification code generated.'
      : `A password recovery code was sent by email to ${destination}`,
    destination,
    ...(useDevelopmentCode ? { developmentCode: code } : {})
  });
}

async function authenticatePassword(req, res, adminOnly = false) {
  const email = normalizeEmail(req.body.email);
  const password = req.body.password;
  if (!emailPattern.test(email) || typeof password !== 'string' || !password || Buffer.byteLength(password, 'utf8') > 72) {
    throw new ApiError(401, 'Email or password is incorrect');
  }

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new ApiError(401, 'Email or password is incorrect');
  }
  if (adminOnly && !config.adminEmails.includes(user.email?.toLowerCase())) {
    throw new ApiError(403, 'Administrator access is required');
  }

  user.lastLoginAt = new Date();
  await user.save();
  return res.json(verificationToken(user));
}

export function loginWithPassword(req, res) {
  return authenticatePassword(req, res);
}

export function loginWithAdminPassword(req, res) {
  return authenticatePassword(req, res, true);
}

export async function resetPassword(req, res) {
  const email = normalizeEmail(req.body.email);
  const code = typeof req.body.code === 'string' ? req.body.code.trim() : '';
  const password = validatePassword(req.body.password);
  if (!emailPattern.test(email) || !/^\d{6}$/.test(code)) {
    throw new ApiError(400, 'Enter the email address and six-digit recovery code');
  }

  const user = await User.findOne({ email }).select('+passwordHash');
  const challenge = await VerificationChallenge.findOne({ accountKey: `email:${email}`, intent: 'password-reset', channel: 'email' });
  if (!user || !challenge || challenge.expiresAt <= new Date()) {
    if (challenge) await challenge.deleteOne();
    throw new ApiError(400, 'That recovery code is invalid or expired. Request a new one.');
  }

  const expected = Buffer.from(challenge.codeDigest, 'hex');
  const provided = Buffer.from(codeDigest(code), 'hex');
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    challenge.attempts += 1;
    if (challenge.attempts >= 5) await challenge.deleteOne();
    else await challenge.save();
    throw new ApiError(401, challenge.attempts >= 5 ? 'Too many incorrect codes. Request a new one.' : 'That recovery code is incorrect');
  }

  await challenge.deleteOne();
  user.passwordHash = await bcrypt.hash(password, passwordRounds);
  user.lastLoginAt = new Date();
  await user.save();
  return res.json(verificationToken(user));
}

export async function register(req, res) {
  const details = signupDetails(req.body);
  const password = validatePassword(req.body.password, true);
  const existingContacts = [details.email && { email: details.email }, details.phone && { phone: details.phone }].filter(Boolean);
  if (await User.exists({ $or: existingContacts })) {
    throw new ApiError(409, 'An account with this email or phone number already exists');
  }

  let user;
  try {
    user = await User.create({
      ...details,
      ...(password ? { passwordHash: await bcrypt.hash(password, passwordRounds) } : {})
    });
  } catch (error) {
    if (error.code === 11000) throw new ApiError(409, 'An account with this email or phone number already exists');
    throw error;
  }

  return res.status(201).json(verificationToken(user));
}

export async function setPassword(req, res) {
  const password = validatePassword(req.body.password);
  const user = await User.findById(req.user.id).select('+passwordHash');
  if (!user) throw new ApiError(401, 'Account no longer exists');

  if (user.passwordHash) {
    const currentPassword = typeof req.body.currentPassword === 'string' ? req.body.currentPassword : '';
    if (!currentPassword || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new ApiError(401, 'Current password is incorrect');
    }
  }

  user.passwordHash = await bcrypt.hash(password, passwordRounds);
  await user.save();
  return res.json({ user: publicUser(user) });
}

export async function getCurrentUser(req, res) {
  const user = await User.findById(req.user.id).select('+passwordHash');
  if (!user) throw new ApiError(401, 'Account no longer exists');
  return res.json({ user: publicUser(user) });
}
