import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import sequelize from './db/config.js';
import apiRouter from './routes.js';
import { env } from './config/environment.js';
import { 
    securityHeaders, 
    compressionMiddleware, 
    sanitizeInput, 
    apiRateLimit 
} from './middleware/security.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { setupSocket } from './services/socket.js';
import { initializeMonitoring } from './services/monitoring.js';
import './models/User.js';
import './models/Game.js';
import './models/UserGame.js';

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
    cors: {
        origin: env.ALLOWED_ORIGINS.split(','),
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Initialize monitoring (Sentry, metrics, etc.)
initializeMonitoring(app);

// Security middleware
app.use(securityHeaders);
app.use(compressionMiddleware);

// CORS configuration
app.use(cors({
    origin: env.ALLOWED_ORIGINS.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// Rate limiting
app.use('/api', apiRateLimit);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: env.NODE_ENV
    });
});

// API routes
app.use('/api', apiRouter);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'GameShelf API v2.0',
        status: 'running',
        documentation: '/api/docs',
        health: '/health'
    });
});

// Socket.io setup
setupSocket(io);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = () => {
    console.log('🔄 Received shutdown signal, closing server gracefully...');
    
    httpServer.close(async () => {
        console.log('🔌 HTTP server closed');
        
        try {
            await sequelize.close();
            console.log('🗄️  Database connection closed');
            process.exit(0);
        } catch (error) {
            console.error('❌ Error during shutdown:', error);
            process.exit(1);
        }
    });

    // Force close after 30 seconds
    setTimeout(() => {
        console.error('❌ Forced shutdown after 30s');
        process.exit(1);
    }, 30000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

const startServer = async () => {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully');

        // Sync models
        if (env.NODE_ENV === 'development') {
            await sequelize.sync({ alter: true });
        } else {
            await sequelize.sync();
        }
        console.log('✅ Database models synchronized');

        // Start server
        httpServer.listen(env.PORT, () => {
            console.log(`🚀 Server running on port ${env.PORT}`);
            console.log(`📊 Environment: ${env.NODE_ENV}`);
            console.log(`🔗 API: http://localhost:${env.PORT}/api`);
            console.log(`💖 Health: http://localhost:${env.PORT}/health`);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

export { app, io };