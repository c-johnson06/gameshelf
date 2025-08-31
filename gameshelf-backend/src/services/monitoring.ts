import type { Application } from 'express';
import * as Sentry from '@sentry/node';
import { env } from '../config/environment.js';

export const initializeMonitoring = (app: Application) => {
    // Sentry error tracking
    if (env.SENTRY_DSN) {
        Sentry.init({
            dsn: env.SENTRY_DSN,
            environment: env.NODE_ENV,
            integrations: [
                Sentry.httpIntegration(),
                Sentry.expressIntegration(),
            ],
            tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
        });
    }


    // Custom metrics
    let requestCount = 0;
    let errorCount = 0;
    
    app.use((req, res, next) => {
        requestCount++;
        
        const start = Date.now();
        
        res.on('finish', () => {
            const duration = Date.now() - start;
            
            if (res.statusCode >= 400) {
                errorCount++;
            }

            // Log slow requests
            if (duration > 1000) {
                console.warn(`🐌 Slow request: ${req.method} ${req.path} - ${duration}ms`);
            }
        });
        
        next();
    });

    // Metrics endpoint
    app.get('/metrics', (req, res) => {
        res.json({
            requests: requestCount,
            errors: errorCount,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
        });
    });

    // Error handler for Sentry
    if (env.SENTRY_DSN) {
        app.use(Sentry.expressErrorHandler());
    }
};