import { Model, DataTypes } from 'sequelize';
import type { InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey } from 'sequelize';
import sequelize from '../db/config.js';
import User from './User.js';

class Follow extends Model<InferAttributes<Follow>, InferCreationAttributes<Follow>> {
    declare followerId: ForeignKey<User['id']>;
    declare followeeId: ForeignKey<User['id']>;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
}

Follow.init({
    followerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
            model: User,
            key: 'id'
        }
    },
    followeeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
            model: User,
            key: 'id'
        }
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
    tableName: 'follows',
    timestamps: true,
    indexes: [
        { unique: true, fields: ['followerId', 'followeeId'] }
    ]
});

User.belongsToMany(Follow, { 
    as: 'Followees',
    through: Follow,
    foreignKey: 'followerId',
    otherKey: 'followeeId'
});

User.belongsToMany(Follow, {
    as: 'Followers',
    through: Follow,
    foreignKey: 'followeeId',
    otherKey: 'followerId'
});

export default Follow;