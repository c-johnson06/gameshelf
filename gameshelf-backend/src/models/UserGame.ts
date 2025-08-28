import { Model, DataTypes } from 'sequelize';
import sequelize from '../db/config.js';
import User from './User.js';
import Game from './Game.js';

class UserGame extends Model{
    playStatus!: 'playing' | 'completed' | 'on-hold' | 'dropped' | 'plan-to-play';
    personalRating!: number | null;
    review!: string | null;
}

UserGame.init({
    playStatus: {
        type: DataTypes.ENUM('playing', 'completed', 'on-hold', 'dropped', 'plan-to-play'),
        allowNull: false
    },

    personalRating: {
        type: DataTypes.FLOAT,
        allowNull: true,
        validate: {
            min: 0,
            max: 10
        }
    },

    review: {
        type: DataTypes.TEXT,
        allowNull: true
    }
},
{
    sequelize,
    tableName: 'user_games'
});

User.belongsToMany(Game, { through: UserGame, foreignKey: 'userId' });
Game.belongsToMany(User, { through: UserGame, foreignKey: 'gameId' });

export default UserGame;