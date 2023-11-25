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
const User_1 = __importDefault(require("./User"));
require("dotenv/config");
const Chat_1 = __importDefault(require("./Chat"));
const SessionAttendee_1 = __importDefault(require("./SessionAttendee"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const UserService_1 = require("../services/UserService");
/**
 * @returns a random salt
 */
function generateSalt() {
    return bcrypt_1.default.genSaltSync();
}
/**
 * @param value to be hashed
 * @param salt added to the hash
 * @returns the hashed value
 */
function hash(value, salt) {
    return bcrypt_1.default.hashSync(value, salt + process.env.DB_PEPPER);
}
// noinspection JSAnnotator (disables a false error)
/**
 * Session class declaration.
 * Useful for handling instances of type Session and defining
 * helper functions.
 */
class Session extends sequelize_1.Model {
    /**
     * @param rawValue raw string (un-hashed, usually a password).
     * @returns hashed string.
     * @private
     */
    hash(rawValue) {
        return hash(rawValue, this.salt);
    }
    /**
     * @returns the session ID
     */
    get sessionId() {
        return this.getDataValue('session_id');
    }
    /**
     * @returns true if the session is only a chatting session.
     */
    get isChat() {
        return this.getDataValue('is_chat');
    }
    /**
     * @returns session salt
     */
    get salt() {
        return this.getDataValue('session_salt');
    }
    /**
     * @param rawPassword new password, un-hashed.
     */
    setPassword(rawPassword) {
        this.setDataValue('session_password', this.hash(rawPassword));
    }
    /**
     * @returns the session creator ID
     */
    get sessionCreatorId() {
        return this.getDataValue('session_creator');
    }
    /**
     * @returns the hashed session password
     */
    get password() {
        return this.getDataValue('session_password');
    }
    /**
     * Creates session salt. Iff the session does not have one.
     */
    setSalt() {
        if (!this.salt) {
            this.setDataValue('session_salt', generateSalt());
        }
    }
    /**
     * @returns the session duration in milliseconds.
     */
    get sessionDuration() {
        return this.getDataValue('session_duration');
    }
    /**
     * @returns the timestamp on which the session was created.
     */
    get createdAt() {
        return this.getDataValue('session_created_at');
    }
    /**
     * @returns user email of user is valid.
     *          Otherwise, undefined.
     */
    getCreatorEmail() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            return (_a = (yield (0, UserService_1.getUser)(this.sessionCreatorId)).result) === null || _a === void 0 ? void 0 : _a.email;
        });
    }
    /**
     * @returns true if the session has ended.
     */
    get hasEnded() {
        return this.sessionDuration !== -1;
    }
    /**
     * Ends the session, updates the duration.
     */
    endSession() {
        this.setDataValue('session_duration', new Date().getTime() - this.createdAt.getTime());
    }
}
exports.default = Session;
/**
 * ORM model for the Session table.
 *
 * >- session_id: ID of the session, random string.
 * >- session_creator: ID of the user creating the session.
 * >- session_duration: Duration of the session in milliseconds.
 * >- session_created_at: Creation time of the session.
 * >- session_password: Used to lock the session.
 * >- session_salt: Used with session password, to add more protection
 *    to chats.
 */
Session.init({
    session_id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    is_chat: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    session_creator: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    session_password: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    session_salt: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    session_duration: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: -1,
    },
    session_created_at: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.Sequelize.fn('now'),
    }
}, {
    initialAutoIncrement: "1000",
    timestamps: false,
    hooks: {
        beforeValidate(session) {
            return __awaiter(this, void 0, void 0, function* () {
                /* generate salt */
                session.setSalt();
                /* Password here is still un-hashed, thus we set it */
                session.setPassword(session.password);
            });
        }
    },
    sequelize: database_1.database,
    modelName: 'Session'
});
/**
 * Each session belongs has a creator.
 */
Session.belongsTo(User_1.default, {
    foreignKey: 'session_creator',
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
});
/**
 * Each session has many chat messages.
 */
Session.hasMany(Chat_1.default, {
    foreignKey: 'session_id',
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
});
/**
 * Each session has many attendees & each user can attend multiple sessions
 * (not necessarily simultaneous sessions).
 */
Session.belongsToMany(User_1.default, { through: SessionAttendee_1.default });
User_1.default.belongsToMany(Session, { through: SessionAttendee_1.default });
