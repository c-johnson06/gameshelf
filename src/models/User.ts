import { DataTypes, Model } from 'sequelize';
import sequelize from '../db/config.js';

class User extends Model{
    id!: number;
    email!: string;
    username!: string;
    passwordHash!: string;
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
},
{
    sequelize,
    tableName: 'users',
});

export default User;
