import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db.mjs';

const JWT_SECRET = process.env.JWT_SECRET || 'jamshed-ali-cinematic-portfolio-secure-jwt-key-2026';
const TOKEN_EXPIRY = '7d';

// Rate limiting in-memory store
const loginAttempts = new Map();

export function hashPassword(plainPassword) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(plainPassword, salt);
}

export function comparePassword(plainPassword, hash) {
  return bcrypt.compareSync(plainPassword, hash);
}

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// Middleware: Require Authenticated Admin
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Authentication token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }

  const user = db.prepare('SELECT id, username, email FROM admin_users WHERE id = ?').get(decoded.id);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Admin user no longer exists' });
  }

  req.user = user;
  next();
}

// Rate Limiting Helper for Login
export function checkLoginRateLimit(ip) {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes
  const maxAttempts = 10;

  const record = loginAttempts.get(ip) || { count: 0, resetTime: now + windowMs };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    loginAttempts.set(ip, record);
    return { allowed: true };
  }

  record.count += 1;
  loginAttempts.set(ip, record);

  if (record.count > maxAttempts) {
    const waitSeconds = Math.ceil((record.resetTime - now) / 1000);
    return {
      allowed: false,
      message: `Too many login attempts. Please try again in ${waitSeconds} seconds.`
    };
  }

  return { allowed: true };
}

export function resetLoginRateLimit(ip) {
  loginAttempts.delete(ip);
}

