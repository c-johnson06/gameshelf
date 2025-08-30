import express from 'express';
import type { Response, Request, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './db/config.js';
import apiRouter from './routes.js';
import securityMiddleware from './middleware/security.js';
import { requestLogger, errorLogger } from './middleware/logger.js';

// It's important to load environment variables at the very top
dotenv.config();

// Import models to ensure they are registered with Sequelize
import './models/User.js';
import './models/Game.js';
import './models/UserGame.js';


const app = express();
const PORT = process.env.PORT || 3000;

// Apply essential middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse JSON bodies
app.use(securityMiddleware); // Apply Helmet and rate limiting
app.use(requestLogger); // Log incoming requests

// Main API router
app.use('/api', apiRouter);

// Centralized error handling middleware
app.use(errorLogger); // Log the error
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    res.status(500).json({
        message: 'An unexpected error occurred.',
        // Avoid sending stack trace in production
        ...(process.env.NODE_ENV === 'development' && { error: err.message, stack: err.stack }),
    });
});


const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
        
        // In production, rely on migrations. In dev, sync can be useful.
        if (process.env.NODE_ENV !== 'production') {
            await sequelize.sync();
            console.log('All models were synchronized successfully.');
        }

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Unable to start the server:', error);
        process.exit(1); // Exit if the database connection fails
    }
}

startServer();