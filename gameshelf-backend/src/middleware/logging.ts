import type { Request, Response } from 'express';
import type { NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const timestamp = new Date().toISOString();
    
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const statusColor = res.statusCode >= 400 ? '\x1b[31m' : res.statusCode >= 300 ? '\x1b[33m' : '\x1b[32m';
        const resetColor = '\x1b[0m';
        
        console.log(
            `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ` +
            `${statusColor}${res.statusCode}${resetColor} - ${duration}ms`
        );
        
        if (duration > 1000) {
            console.warn(`🐌 SLOW REQUEST: ${req.method} ${req.originalUrl} took ${duration}ms`);
        }
    });
    
    next();
};

export const productionLogger = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        
        if (res.statusCode >= 400 || duration > 5000) {
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                method: req.method,
                url: req.originalUrl,
                statusCode: res.statusCode,
                duration: `${duration}ms`,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                ...(res.statusCode >= 400 && { 
                    error: true,
                    query: req.query,
                    body: req.method !== 'GET' ? req.body : undefined
                })
            }));
        }
    });
    
    next();
};