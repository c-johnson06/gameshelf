// gameshelf-backend/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
    code?: string;
}

// Global error handler
export const errorHandler = (
    err: AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let code = err.code;

    // Handle specific error types
    if (err.name === 'SequelizeValidationError') {
        statusCode = 400;
        message = 'Validation error';
        code = 'VALIDATION_ERROR';
    } else if (err.name === 'SequelizeUniqueConstraintError') {
        statusCode = 409;
        message = 'Resource already exists';
        code = 'DUPLICATE_ERROR';
    } else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
        code = 'INVALID_TOKEN';
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
        code = 'TOKEN_EXPIRED';
    } else if (err.name === 'SequelizeDatabaseError') {
        statusCode = 500;
        message = 'Database error';
        code = 'DATABASE_ERROR';
    }

    // Log error details (but not in test environment)
    if (process.env.NODE_ENV !== 'test') {
        const errorLog = {
            timestamp: new Date().toISOString(),
            error: {
                name: err.name,
                message: err.message,
                code,
                statusCode,
                stack: err.stack
            },
            request: {
                method: req.method,
                url: req.originalUrl,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                body: req.method !== 'GET' ? req.body : undefined,
                query: req.query,
                params: req.params
            }
        };

        if (statusCode >= 500) {
            console.error('🚨 SERVER ERROR:', JSON.stringify(errorLog, null, 2));
        } else {
            console.warn('⚠️  CLIENT ERROR:', JSON.stringify(errorLog, null, 2));
        }
    }

    // Send error response
    res.status(statusCode).json({
        success: false,
        message: process.env.NODE_ENV === 'production' && statusCode === 500 
            ? 'Something went wrong on our end' 
            : message,
        code,
        ...(process.env.NODE_ENV === 'development' && { 
            stack: err.stack,
            details: err 
        })
    });
};

// 404 handler for unmatched routes
export const notFoundHandler = (req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`,
        code: 'ROUTE_NOT_FOUND'
    });
};

// Health check endpoint
export const healthCheck = (req: Request, res: Response) => {
    const uptime = process.uptime();
    const timestamp = new Date().toISOString();
    
    res.status(200).json({
        success: true,
        message: 'Server is healthy',
        data: {
            status: 'OK',
            timestamp,
            uptime: {
                seconds: Math.floor(uptime),
                human: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`
            },
            environment: process.env.NODE_ENV || 'development',
            version: '1.0.0'
        }
    });
};