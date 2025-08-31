import { DataTypes, Model, Op } from 'sequelize';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../db/config.js';
import { env } from '../config/environment.js';

class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
    declare id: CreationOptional<number>;
    declare email: string;
    declare username: string;
    declare passwordHash: string;
    declare firstName: CreationOptional<string>;
    declare lastName: CreationOptional<string>;
    declare bio: CreationOptional<string>;
    declare avatar: CreationOptional<string>;
    declare isEmailVerified: CreationOptional<boolean>;
    declare emailVerificationToken: CreationOptional<string>;
    declare passwordResetToken: CreationOptional<string>;
    declare passwordResetExpires: CreationOptional<Date>;
    declare lastLoginAt: CreationOptional<Date>;
    declare isActive: CreationOptional<boolean>;
    declare preferences: CreationOptional<object>;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    // Instance methods
    async validatePassword(password: string): Promise<boolean> {
        return bcrypt.compare(password, this.passwordHash);
    }

    async hashPassword(password: string): Promise<void> {
        this.passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
    }

    toSafeJSON() {
        const { passwordHash, emailVerificationToken, passwordResetToken, ...safeUser } = this.toJSON();
        return safeUser;
    }

    // Static methods
    static async findByEmailOrUsername(identifier: string) {
        return this.findOne({
            where: {
                [Op.or]: [
                    { email: identifier.toLowerCase() },
                    { username: identifier }
                ]
            }
        });
    }
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
        },
        set(value: string) {
            this.setDataValue('email', value.toLowerCase());
        }
    },
    username: {
        type: DataTypes.STRING(32),
        unique: true,
        allowNull: false,
        validate: {
            len: [3, 32],
            is: /^[a-zA-Z0-9_-]+$/
        }
    },
    passwordHash: {
        type: DataTypes.STRING(128),
        allowNull: false
    },
    firstName: {
        type: DataTypes.STRING(50),
        allowNull: true,
        validate: {
            len: [1, 50]
        }
    },
    lastName: {
        type: DataTypes.STRING(50),
        allowNull: true,
        validate: {
            len: [1, 50]
        }
    },
    bio: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
            len: [0, 500]
        }
    },
    avatar: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isEmailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    emailVerificationToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    passwordResetToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    passwordResetExpires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    preferences: {
        type: DataTypes.JSON,
        defaultValue: {
            theme: 'dark',
            emailNotifications: true,
            publicProfile: true,
            showEmail: false
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
    tableName: 'users',
    timestamps: true,
    indexes: [
        { fields: ['email'] },
        { fields: ['username'] },
        { fields: ['isActive'] },
        { fields: ['createdAt'] }
    ],
    hooks: {
        beforeUpdate: (user) => {
            user.updatedAt = new Date();
        }
    }
});

export default User;