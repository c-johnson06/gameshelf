import { Model, DataTypes } from 'sequelize';
import type { InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey } from 'sequelize';
import sequelize from '../db/config.js';
import User from './User.js';
import Game from './Game.js';

class UserGame extends Model<InferAttributes<UserGame>, InferCreationAttributes<UserGame>> {
    declare userId: ForeignKey<User['id']>;
    declare gameId: ForeignKey<Game['id']>;
    declare playStatus: 'playing' | 'completed' | 'on-hold' | 'dropped' | 'plan-to-play';
    declare personalRating: CreationOptional<number | null>;
    declare review: CreationOptional<string | null>;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
}

UserGame.init({
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },

    gameId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Game,
            key: 'id'
        }
    },

    playStatus: {
        type: DataTypes.ENUM('playing', 'completed', 'on-hold', 'dropped', 'plan-to-play'),
        allowNull: false,
        defaultValue: 'plan-to-play'
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
    },

    createdAt: {
        type: DataTypes.DATE,
        allowNull: false
    },

    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
    }
},
{
    sequelize,
    tableName: 'user_games',
    timestamps: true
});

// Define associations
User.belongsToMany(Game, { 
    through: UserGame, 
    foreignKey: 'userId',
    otherKey: 'gameId',
    as: 'Games'
});

Game.belongsToMany(User, { 
    through: UserGame, 
    foreignKey: 'gameId',
    otherKey: 'userId',
    as: 'Users'
});

UserGame.belongsTo(User, { foreignKey: 'userId' });
UserGame.belongsTo(Game, { foreignKey: 'gameId' });

export default UserGame;