import { DataTypes, Model } from 'sequelize';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import sequelize from '../db/config.js';

class Game extends Model<InferAttributes<Game>, InferCreationAttributes<Game>> {
    declare id: number;
    declare name: string;
    declare slug: CreationOptional<string>;
    declare description: CreationOptional<string>;
    declare genres: CreationOptional<string>;
    declare backgroundImage: CreationOptional<string>;
    declare screenshots: CreationOptional<string[]>;
    declare platform: CreationOptional<string>;
    declare releaseDate: CreationOptional<Date>;
    declare rating: CreationOptional<number>;
    declare ratingsCount: CreationOptional<number>;
    declare metacriticScore: CreationOptional<number>;
    declare developers: CreationOptional<string>;
    declare publishers: CreationOptional<string>;
    declare website: CreationOptional<string>;
    declare esrbRating: CreationOptional<string>;
    declare tags: CreationOptional<string[]>;
    declare isPopular: CreationOptional<boolean>;
    declare lastUpdated: CreationOptional<Date>;
}

Game.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    slug: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    genres: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    backgroundImage: {
        type: DataTypes.STRING,
        allowNull: true
    },
    screenshots: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    platform: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    releaseDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    rating: {
        type: DataTypes.FLOAT,
        allowNull: true,
        validate: {
            min: 0,
            max: 10
        }
    },
    ratingsCount: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    metacriticScore: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 0,
            max: 100
        }
    },
    developers: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    publishers: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    website: {
        type: DataTypes.STRING,
        allowNull: true
    },
    esrbRating: {
        type: DataTypes.STRING(10),
        allowNull: true
    },
    tags: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    isPopular: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    lastUpdated: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    tableName: 'games',
    timestamps: false,
    indexes: [
        { fields: ['name'] },
        { fields: ['rating'] },
        { fields: ['releaseDate'] },
        { fields: ['isPopular'] },
        { fields: ['slug'] },
        { 
            name: 'games_search_idx',
            fields: ['name', 'genres'],
            type: 'FULLTEXT'
        }
    ]
});

export default Game;
