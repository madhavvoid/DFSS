import nodemailer from 'nodemailer';
import { config } from '../config/env.js';
import { ApiError } from '../middleware/errorHandler.js';

async function sendEmailCode(email, code) {
  if (!config.smtpHost || !config.smtpFrom) {
    throw new ApiError(503, 'Email verification is not configured. Contact the site administrator.');
  }

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    ...(config.smtpUser && config.smtpPassword
      ? { auth: { user: config.smtpUser, pass: config.smtpPassword } }
      : {})
  });

  await transporter.sendMail({
    from: config.smtpFrom,
    to: email,
    subject: 'Your TPCM verification code',
    text: `Your TPCM verification code is ${code}. It expires in 10 minutes. If you did not request this code, you can ignore this email.`,
    html: `<p>Your TPCM verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:8px">${code}</p><p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>`
  });
}

async function sendSmsCode(phone, code) {
  const { twilioAccountSid, twilioAuthToken, twilioFromPhone } = config;
  if (!twilioAccountSid || !twilioAuthToken || !twilioFromPhone) {
    throw new ApiError(503, 'SMS verification is not configured. Choose email or contact the site administrator.');
  }

  const body = new URLSearchParams({
    To: phone,
    From: twilioFromPhone,
    Body: `Your TPCM confirmation code is ${code}. It expires in 10 minutes. Do not share this code.`
  });
  let response;
  try {
    response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    });
  } catch {
    throw new ApiError(502, 'Could not connect to the SMS provider. Try email confirmation instead.');
  }
  if (!response.ok) throw new ApiError(502, 'The SMS provider could not deliver the confirmation code. Check its configuration.');
}

export function sendVerificationCode({ email, phone, code, channel }) {
  return channel === 'sms' ? sendSmsCode(phone, code) : sendEmailCode(email, code);
}