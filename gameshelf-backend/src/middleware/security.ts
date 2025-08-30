import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Router } from 'express';

const securityMiddleware = Router();

securityMiddleware.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, 
  standardHeaders: true, 
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

securityMiddleware.use(limiter);

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, 
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
});

export const authRateLimiter = authLimiter;

export default securityMiddleware;