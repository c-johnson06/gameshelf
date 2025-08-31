import { Model, DataTypes } from 'sequelize';
import type { InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey } from 'sequelize';
import sequelize from '../db/config.js';
import User from './User.js';
import Game from './Game.js';

type PlayStatus = 'playing' | 'completed' | 'on-hold' | 'dropped' | 'plan-to-play' | 'abandoned';

class UserGame extends Model<InferAttributes<UserGame>, InferCreationAttributes<UserGame>> {
    declare userId: ForeignKey<User['id']>;
    declare gameId: ForeignKey<Game['id']>;
    declare playStatus: PlayStatus;
    declare personalRating: CreationOptional<number | null>;
    declare review: CreationOptional<string | null>;
    declare hoursPlayed: CreationOptional<number | null>;
    declare completionPercentage: CreationOptional<number | null>;
    declare difficulty: CreationOptional<number | null>; // 1-5 scale
    declare startedAt: CreationOptional<Date | null>;
    declare completedAt: CreationOptional<Date | null>;
    declare lastPlayedAt: CreationOptional<Date | null>;
    declare isFavorite: CreationOptional<boolean>;
    declare isRecommended: CreationOptional<boolean>;
    declare playCount: CreationOptional<number>;
    declare achievements: CreationOptional<object[]>;
    declare notes: CreationOptional<string | null>;
    declare tags: CreationOptional<string[]>;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    // Instance methods
    getPlayDuration(): number | null {
        if (this.startedAt && this.completedAt) {
            return Math.ceil((this.completedAt.getTime() - this.startedAt.getTime()) / (1000 * 60 * 60 * 24));
        }
        return null;
    }

    updateLastPlayed(): void {
        this.lastPlayedAt = new Date();
    }
}

UserGame.init({
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
            model: User,
            key: 'id'
        }
    },
    gameId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
            model: Game,
            key: 'id'
        }
    },
    playStatus: {
        type: DataTypes.ENUM('playing', 'completed', 'on-hold', 'dropped', 'plan-to-play', 'abandoned'),
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
        allowNull: true,
        validate: {
            len: [0, 2000]
        }
    },
    hoursPlayed: {
        type: DataTypes.FLOAT,
        allowNull: true,
        validate: {
            min: 0
        }
    },
    completionPercentage: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 0,
            max: 100
        }
    },
    difficulty: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 1,
            max: 5
        }
    },
    startedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    completedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    lastPlayedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    isFavorite: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isRecommended: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    playCount: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        validate: {
            min: 0
        }
    },
    achievements: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
            len: [0, 1000]
        }
    },
    tags: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    sequelize,
    tableName: 'user_games',
    timestamps: true,
    indexes: [
        { fields: ['userId'] },
        { fields: ['gameId'] },
        { fields: ['playStatus'] },
        { fields: ['personalRating'] },
        { fields: ['isFavorite'] },
        { fields: ['lastPlayedAt'] },
        { fields: ['createdAt'] }
    ],
    hooks: {
        beforeUpdate: (userGame) => {
            // Auto-set completion date when status changes to completed
            if (userGame.changed('playStatus') && userGame.playStatus === 'completed' && !userGame.completedAt) {
                userGame.completedAt = new Date();
            }
            
            // Auto-set started date when status changes from plan-to-play
            if (userGame.changed('playStatus') && userGame.previous('playStatus') === 'plan-to-play' && !userGame.startedAt) {
                userGame.startedAt = new Date();
            }
        }
    }
});

// Enhanced Associations with detailed scopes
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

UserGame.belongsTo(User, { foreignKey: 'userId', as: 'User' });
UserGame.belongsTo(Game, { foreignKey: 'gameId', as: 'Game' });

User.hasMany(UserGame, { foreignKey: 'userId', as: 'UserGames' });
Game.hasMany(UserGame, { foreignKey: 'gameId', as: 'UserGames' });

// Enhanced scopes
User.addScope('withStats', {
    include: [{
        model: UserGame,
        as: 'UserGames',
        attributes: ['playStatus', 'personalRating', 'hoursPlayed'],
    }]
});

User.addScope('withGames', {
    include: [{
        model: Game,
        as: 'Games',
        through: {
            attributes: ['playStatus', 'personalRating', 'review', 'hoursPlayed', 'isFavorite']
        }
    }]
});

Game.addScope('withUserStats', {
    include: [{
        model: UserGame,
        as: 'UserGames',
        attributes: ['personalRating', 'playStatus'],
        required: false
    }]
});

export default UserGame;