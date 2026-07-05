import rateLimit from 'express-rate-limit';
import config from '../config';
import { logger } from '../utils/logger';

const isDev = config.NODE_ENV === 'development';

// 1. General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 10000 : 100, // 10000 requests in dev, 100 in prod
  message: { status: 'error', message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for IP ${req.ip} on API route ${req.originalUrl}`);
    res.status(options.statusCode).send(options.message);
  }
});

// 2. Login rate limiter
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 1000 : 10, // 1000 attempts in dev, 10 in prod
  message: { status: 'error', message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for IP ${req.ip} on login attempts`);
    res.status(options.statusCode).send(options.message);
  }
});

// 3. Register rate limiter
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isDev ? 1000 : 5, // 1000 attempts in dev, 5 in prod
  message: { status: 'error', message: 'Too many accounts created from this IP. Please try again after an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for IP ${req.ip} on registration attempts`);
    res.status(options.statusCode).send(options.message);
  }
});
