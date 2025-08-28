import { DataTypes, Model } from 'sequelize';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import sequelize from '../db/config.js';

class Game extends Model<InferAttributes<Game>, InferCreationAttributes<Game>> {
    declare id: number;
    declare name: string;
    declare genres: CreationOptional<string>;
    declare backgroundImage: CreationOptional<string>;
    declare platform: CreationOptional<string>;
    declare releaseDate: CreationOptional<Date>;
    declare rating: CreationOptional<number>;
}

Game.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },

    name: {
        type: DataTypes.STRING(128),
        allowNull: false
    },

    genres: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    backgroundImage: {
        type: DataTypes.STRING,
        allowNull: true
    },

    platform: {
        type: DataTypes.STRING(64),
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
    }
},
{
    sequelize,
    tableName: 'games',
    timestamps: false
});

export default Game;