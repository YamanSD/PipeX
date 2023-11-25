"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../database");
const bcrypt_1 = __importDefault(require("bcrypt"));
require("dotenv/config");
/**
 * @returns a random salt
 */
function generateSalt() {
    return bcrypt_1.default.genSaltSync();
}
// noinspection JSAnnotator (disables a false error)
/**
 * User class declaration.
 * Useful for handling instances of type User and defining
 * helper functions.
 */
class User extends sequelize_1.Model {
    /**
     * @param rawValue raw string (un-hashed, usually a password).
     * @returns hashed string.
     * @private
     */
    hash(rawValue) {
        return bcrypt_1.default.hashSync(rawValue, this.salt + process.env.DB_PEPPER);
    }
    /**
     * @returns user ID.
     */
    get uid() {
        return this.getDataValue('uid');
    }
    /**
     * @returns user email
     */
    get email() {
        return this.getDataValue('user_email');
    }
    /**
     * @returns hashed user password
     */
    get password() {
        return this.getDataValue('user_password');
    }
    /**
     * @param rawPassword new password, un-hashed.
     */
    setPassword(rawPassword) {
        this.setDataValue('user_password', this.hash(rawPassword));
    }
    /**
     * @returns true if the user is banned
     */
    get isBanned() {
        return this.getDataValue('is_banned');
    }
    /**
     * @returns user salt
     */
    get salt() {
        return this.getDataValue('user_salt');
    }
    /**
     * @returns true if the user is an admin
     */
    get isAdmin() {
        return this.getDataValue('is_admin');
    }
    /**
     * @returns export data for the user to be sent over the internet
     */
    get export() {
        return {
            user_email: this.email,
            is_banned: this.isBanned,
            is_admin: this.isAdmin,
        };
    }
    /**
     * Creates user salt. Iff the user does not have one.
     */
    setSalt() {
        if (!this.salt) {
            this.setDataValue('user_salt', generateSalt());
        }
    }
    /**
     * @param rawPassword un-hashed password to check if valid
     * @returns true if the password matches the stored user password
     */
    isValidPassword(rawPassword) {
        return this.hash(rawPassword) === this.password;
    }
    /**
     * @param banned status of the user
     */
    setStatus(banned) {
        this.setDataValue('is_banned', banned);
    }
    /**
     * @param email new user email
     */
    setEmail(email) {
        this.setDataValue('user_email', email.toLowerCase());
    }
}
exports.default = User;
/**
 * ORM model for the User table.
 *
 * >- uid: user ID.
 * >- user_email: String representing the email of the user.
 * >- user_password: String representing the encrypted password of the user.
 * >- user_salt: String representing the user's salt. Used in password encryption.
 * >- is_banned: Boolean, if true user is banned and cannot access services.
 *    Default is false.
 * >- is_admin: Boolean, if true user is an admin and can access statistics
 *    & create other admin users.
 */
User.init({
    uid: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_email: {
        type: sequelize_1.DataTypes.STRING,
        unique: true,
        validate: {
            isEmail: true
        },
    },
    user_password: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    user_salt: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    is_banned: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false
    },
    is_admin: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    hooks: {
        beforeValidate(user) {
            return __awaiter(this, void 0, void 0, function* () {
                /* generate salt */
                user.setSalt();
                /* set emails to lowercase */
                user.setEmail(user.email);
                /* Password here is still un-hashed, thus we set it */
                user.setPassword(user.password);
            });
        }
    },
    sequelize: database_1.database,
    modelName: 'User'
});
