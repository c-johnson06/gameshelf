import { Sequelize } from "sequelize";
import { env } from '../config/environment.js';

let sequelize: Sequelize;

if (env.NODE_ENV === 'production') {
    if (!env.DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable is required for production');
    }
    
    sequelize = new Sequelize(env.DATABASE_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: true, // Fixed security issue
            }
        },
        logging: false,
        pool: {
            max: 20,
            min: 5,
            acquire: 30000,
            idle: 10000
        },
        benchmark: true,
        retry: {
            max: 3
        }
    });
} else {
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: './gameshelf.sqlite',
        logging: env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 10,
            min: 2,
            acquire: 30000,
            idle: 10000
        }
    });
}

export default sequelize;