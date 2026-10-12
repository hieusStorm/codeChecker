//needed imports to make sessions work
const crypto = require('crypto');

//get session secrects
require('dotenv').config();
const sessionSecret = process.env.SESSION_SECRET;
if (!process.env.MONGODB_URI || !process.env.DB_NAME || !sessionSecret) {
    throw new Error('Missing MONGODB_URI, DB_NAME, or SESSION_SECRET in .env');
}


function parseCookies(req) {
  return Object.fromEntries(
    (req.headers.cookie || '').split(';').filter(Boolean).map((cookie) => {
      const separator = cookie.indexOf('=');
      return [cookie.slice(0, separator).trim(), decodeURIComponent(cookie.slice(separator + 1))];
    })
  );
}

function createSession(userId) {
  const payload = Buffer.from(JSON.stringify({ userId: String(userId), expiresAt: Date.now() + 86400000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', sessionSecret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function readSession(req) {
  try {
    const [payload, signature] = (parseCookies(req).session || '').split('.');
    const expected = crypto.createHmac('sha256', sessionSecret).update(payload).digest();
    const actual = Buffer.from(signature, 'base64url');
    if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}

function requireAuth(req, res, next) {
  const session = readSession(req);
  if (!session) return res.status(401).json({ message: 'Please log in' });
  req.session = session;
  next();
}

module.exports = {parseCookies, createSession, readSession, requireAuth};