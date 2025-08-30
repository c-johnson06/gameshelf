import { Sequelize } from "sequelize";
import dotenv from 'dotenv';

dotenv.config();

let sequelize: Sequelize;

if (process.env.NODE_ENV === 'production') {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable is not set for production');
    }
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false 
            }
        },
        logging: false
    });
} else {
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: './gameshelf.sqlite',
        logging: console.log
    });
}

export default sequelize;
