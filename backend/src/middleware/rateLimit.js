import rateLimit from 'express-rate-limit';

const json = (message) => (_req, res) => res.status(429).json({ success: false, message });

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: json('Too many requests, please slow down.'),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: json('Too many login attempts. Please try again in 15 minutes.'),
});
