import { DataTypes, Model } from 'sequelize';
import sequelize from '../db/config.js';

class Game extends Model{
    id!: number;
    name!: string;
    genre!: string;
    background_image!: string;
    platform!: string;
    releaseDate!: Date;
    rating!: number;
}

Game.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true
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
})

export default Game;