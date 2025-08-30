// gameshelf-backend/src/middleware/security.ts
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Rate limiting for authentication endpoints
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window per IP
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip successful requests
    skipSuccessfulRequests: true,
});

// General rate limiting
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window per IP
    message: {
        success: false,
        message: 'Too many requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Search-specific rate limiting
export const searchLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 searches per minute per IP
    message: {
        success: false,
        message: 'Too many search requests, please slow down.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Security headers with helmet
export const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: [
                "'self'", 
                "'unsafe-inline'", 
                "https://fonts.googleapis.com"
            ],
            fontSrc: [
                "'self'", 
                "https://fonts.gstatic.com"
            ],
            imgSrc: [
                "'self'", 
                "data:", 
                "https:", 
                "http://media.rawg.io",
                "https://media.rawg.io"
            ],
            scriptSrc: ["'self'"],
            connectSrc: [
                "'self'",
                ...(process.env.NODE_ENV === 'development' ? ['ws://localhost:*', 'http://localhost:*'] : [])
            ],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        }
    },
    crossOriginEmbedderPolicy: false,
    // Remove X-Powered-By header
    hidePoweredBy: true,
    // Set various security headers
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
});