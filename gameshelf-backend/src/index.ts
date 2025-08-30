import express from 'express';
import type { Response, Request, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './db/config.js';
import apiRouter from './routes.js';
import { requestLogger } from './middleware/logging.js';
import { errorHandler, notFoundHandler, healthCheck } from './middleware/errorHandler.js';

// Load environment variables first
dotenv.config();

// Import models to ensure they are registered with Sequelize
import './models/User.js';
import './models/Game.js';
import './models/UserGame.js';

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://localhost:4173'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow all origins for development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', healthCheck);

// API routes
app.use('/api', apiRouter);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

const startServer = async () => {
    try {
        console.log('🚀 Starting GameShelf Backend Server...');
        console.log('📊 Environment:', process.env.NODE_ENV || 'development');
        
        // Test database connection
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully');
        
        // Sync database in development
        if (process.env.NODE_ENV !== 'production') {
            await sequelize.sync();
            console.log('✅ Database models synchronized');
        }
        
        // Start server
        app.listen(PORT, () => {
            console.log(`🌟 Server running on http://localhost:${PORT}`);
            console.log(`🔍 API available at http://localhost:${PORT}/api`);
            console.log(`💚 Health check at http://localhost:${PORT}/health`);
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

startServer();