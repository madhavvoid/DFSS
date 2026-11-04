import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';
import VerificationChallenge from '../models/VerificationChallenge.js';
import User from '../models/User.js';
import { config } from '../config/env.js';
import { ApiError } from '../middleware/errorHandler.js';
import { sendVerificationCode } from '../services/emailService.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function maskPhone(phone) {
  return `${phone.slice(0, 3)}${'*'.repeat(Math.max(3, phone.length - 5))}${phone.slice(-2)}`;
}

function verificationChannel(value) {
  if (value === undefined || value === 'email') return 'email';
  if (value === 'sms') return 'sms';
  throw new ApiError(400, 'Choose email or SMS for your confirmation code');
}

async function findUserByIdentifier(identifier) {
  if (emailPattern.test(identifier)) return User.findOne({ email: normalizeEmail(identifier) });
  validatePhone(identifier);
  return User.findOne({ phone: identifier });
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
  if (!email && !phone) throw new ApiError(400, 'Enter an email address or phone number');
  return { name, email: email || undefined, phone: phone || undefined };
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
  return { id: user._id.toString(), name: user.name, email: user.email || null, phone: user.phone || null };
}

export async function requestVerificationCode(req, res) {
  const intent = req.body.intent;
  const channel = verificationChannel(req.body.channel);
  if (!['signup', 'signin'].includes(intent)) throw new ApiError(400, 'Choose sign in or sign up');

  let details;
  let email;
  let phone;
  let key;
  if (intent === 'signup') {
    details = signupDetails(req.body);
    email = details.email;
    phone = details.phone;
    if (channel === 'email' && !email) throw new ApiError(400, 'Enter an email address to receive your confirmation code');
    if (channel === 'sms' && !phone) throw new ApiError(400, 'Enter a phone number to receive your confirmation code');
    const existingContacts = [email && { email }, phone && { phone }].filter(Boolean);
    if (await User.exists({ $or: existingContacts })) {
      throw new ApiError(409, 'An account with this email or phone number already exists');
    }
    key = accountKey(details);
  } else {
    const identifier = typeof req.body.identifier === 'string' ? req.body.identifier.trim() : '';
    if (!identifier) throw new ApiError(400, 'Enter your email address or phone number');
    const user = await findUserByIdentifier(identifier.includes('@') ? normalizeEmail(identifier) : normalizePhone(identifier));
    if (!user) throw new ApiError(404, 'No account was found for that email or phone number');
    email = user.email;
    phone = user.phone;
    key = accountKey(user);
  }

  if (channel === 'sms' && !phone) throw new ApiError(400, 'This account does not have a phone number for SMS confirmation');
  if (channel === 'email' && !email) throw new ApiError(400, 'This account does not have an email address for email confirmation');

  const existingCode = await VerificationChallenge.findOne({ accountKey: key });
  if (existingCode && Date.now() - existingCode.sentAt.getTime() < 60_000) {
    throw new ApiError(429, 'Please wait a minute before requesting another code');
  }

  const code = String(randomInt(100000, 1000000));
  const sentAt = new Date();
  await VerificationChallenge.findOneAndUpdate(
    { accountKey: key },
    { codeDigest: codeDigest(code), intent, channel, sentAt, expiresAt: new Date(sentAt.getTime() + 10 * 60_000), attempts: 0 },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (!config.developmentAuthCodes) {
    try {
      await sendVerificationCode({ email, phone, code, channel });
    } catch (error) {
      await VerificationChallenge.deleteOne({ accountKey: key });
      throw error;
    }
  }

  const destination = channel === 'sms' ? maskPhone(phone) : maskEmail(email);
  return res.json({
    message: config.developmentAuthCodes
      ? 'Local development verification code generated.'
      : `A verification code was sent by ${channel === 'sms' ? 'SMS' : 'email'} to ${destination}`,
    destination,
    ...(config.developmentAuthCodes ? { developmentCode: code } : {})
  });
}

export async function verifyEmailCode(req, res) {
  const intent = req.body.intent;
  const channel = verificationChannel(req.body.channel);
  const code = typeof req.body.code === 'string' ? req.body.code.trim() : '';
  if (!['signup', 'signin'].includes(intent) || !/^\d{6}$/.test(code)) {
    throw new ApiError(400, 'Enter the six-digit verification code');
  }

  let details;
  let user;
  let email;
  let phone;
  let key;
  if (intent === 'signup') {
    details = signupDetails(req.body);
    email = details.email;
    phone = details.phone;
    if (channel === 'email' && !email) throw new ApiError(400, 'Enter an email address to receive your confirmation code');
    if (channel === 'sms' && !phone) throw new ApiError(400, 'Enter a phone number to receive your confirmation code');
    key = accountKey(details);
  } else {
    const identifier = typeof req.body.identifier === 'string' ? req.body.identifier.trim() : '';
    user = await findUserByIdentifier(identifier.includes('@') ? normalizeEmail(identifier) : normalizePhone(identifier));
    if (!user) throw new ApiError(404, 'No account was found for that email or phone number');
    email = user.email;
    phone = user.phone;
    key = accountKey(user);
  }

  const challenge = await VerificationChallenge.findOne({ accountKey: key, intent, channel });
  if (!challenge || challenge.expiresAt <= new Date()) {
    if (challenge) await challenge.deleteOne();
    throw new ApiError(400, 'That code has expired. Request a new one.');
  }

  const expected = Buffer.from(challenge.codeDigest, 'hex');
  const provided = Buffer.from(codeDigest(code), 'hex');
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    challenge.attempts += 1;
    if (challenge.attempts >= 5) await challenge.deleteOne();
    else await challenge.save();
    throw new ApiError(401, challenge.attempts >= 5 ? 'Too many incorrect codes. Request a new one.' : 'That verification code is incorrect');
  }

  await challenge.deleteOne();
  if (intent === 'signup') {
    const existingContacts = [email && { email }, phone && { phone }].filter(Boolean);
    if (await User.exists({ $or: existingContacts })) {
      throw new ApiError(409, 'An account with this email or phone number already exists');
    }
    try {
      user = await User.create({
        ...details
      });
    } catch (error) {
      if (error.code === 11000) throw new ApiError(409, 'An account with this email or phone number already exists');
      throw error;
    }
  }

  return res.json(verificationToken(user));
}

export async function getCurrentUser(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(401, 'Account no longer exists');
  return res.json({ user: publicUser(user) });
}

