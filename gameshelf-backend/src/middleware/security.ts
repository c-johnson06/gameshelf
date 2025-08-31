import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import type { Request, Response } from 'express';
import { env } from '../config/environment.js';

// Rate limiting
export const createRateLimit = (windowMs = env.RATE_LIMIT_WINDOW_MS, max = env.RATE_LIMIT_MAX_REQUESTS) =>
  rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

// Auth rate limiting (stricter)
export const authRateLimit = createRateLimit(15 * 60 * 1000, 5); // 5 attempts per 15 minutes

// API rate limiting
export const apiRateLimit = createRateLimit();

// Security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'http:'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", 'https://api.rawg.io'],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// Compression middleware
export const compressionMiddleware = compression({
  filter: (req: Request, res: Response) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
});

export const sanitizeInput = (req: Request, res: Response, next) => {
  // Remove any potentially dangerous characters from strings
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      // Modify the object in place
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          obj[key] = sanitize(obj[key]);
        }
      }
    }
    return obj;
  };

  // Modify the objects in place instead of reassigning them
  if (req.body) {
    sanitize(req.body);
  }
  if (req.query) {
    sanitize(req.query);
  }
  if (req.params) {
    sanitize(req.params);
  }
  next();
};