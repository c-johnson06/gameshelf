import { DataTypes, Model } from 'sequelize';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import sequelize from '../db/config.js';

class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
    declare id: CreationOptional<number>;
    declare email: string;
    declare username: string;
    declare passwordHash: string;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
}

User.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    email: {
        type: DataTypes.STRING(128),
        unique: true,
        allowNull: false,
        validate: {
            isEmail: true
        }
    },

    username: {
        type: DataTypes.STRING(32),
        unique: true,
        allowNull: false,
        validate: {
            len: [3, 32]
        }
    },

    passwordHash: {
        type: DataTypes.STRING(128),
        allowNull: false
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
    tableName: 'users',
    timestamps: true
});

export default User;