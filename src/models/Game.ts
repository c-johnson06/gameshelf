import { DataTypes, Model } from 'sequelize';
import sequelize from '../db/config.js';

class Game extends Model{
    id!: number;
    title!: string;
    genre!: string;
    backgroundImage!: string;
    platform!: string;
    releaseDate!: Date;
    rating!: number;
}

Game.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },

    title: {
        type: DataTypes.STRING(128),
        allowNull: false
    },

    genre: {
        type: DataTypes.STRING(64),
        allowNull: false
    },

    backgroundImage: {
        type: DataTypes.STRING(256),
        allowNull: true
    },

    platform: {
        type: DataTypes.STRING(64),
        allowNull: false
    },

    releaseDate: {
        type: DataTypes.DATE,
        allowNull: false
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