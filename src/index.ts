import express from 'express';
import type{ Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './db/config.js';
import apiRouter from './routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api', apiRouter);

app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!');
});

const startServer = async() => {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');

        await sequelize.sync({alter: true});
        console.log('All models were synchronized successfully.');

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

startServer();