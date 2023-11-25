"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const crypto = __importStar(require("crypto"));
const User_1 = __importDefault(require("./User"));
require("dotenv/config");
// noinspection JSAnnotator (disables a false error)
/**
 * Chat class declaration.
 * Useful for handling instances of type Chat and defining
 * helper functions.
 */
class Chat extends sequelize_1.Model {
    /**
     * @returns the chat ID
     */
    get chatId() {
        return this.getDataValue('chat_id');
    }
    /**
     * @returns the session ID
     */
    get sessionId() {
        return this.getDataValue('session_id');
    }
    /**
     * @returns the timestamp of the message
     */
    get timestamp() {
        return this.getDataValue('chat_timestamp').getTime();
    }
    /**
     * @returns the sending user's ID
     */
    get senderId() {
        return this.getDataValue('chat_sender');
    }
    /**
     * @returns the initialization used in chat encryption.
     */
    get initVector() {
        return this.getDataValue('init_vector');
    }
    /**
     * @returns the auth tag used in chat encryption.
     */
    get authTag() {
        return this.getDataValue('auth_tag');
    }
    /**
     * @returns the receiving user's ID if present, else null
     */
    get receiverId() {
        return this.getDataValue('chat_receiver');
    }
    /**
     * Encrypts the message chat, iff it has never been encrypted before.
     *
     * @param message to be encrypted.
     */
    encrypt(message) {
        /* make sure we haven't encrypted the data before */
        if (!this.initVector) { // Should be undefined to start
            /* initialization vector of random bytes */
            const iv = crypto.randomBytes(16);
            /* cipher object */
            const cipher = crypto.createCipheriv(process.env.CRYPTO_ALG, Buffer.from(process.env.CRYPTO_KEY), iv);
            let result = cipher.update(message, 'utf-8', 'hex');
            result += cipher.final('hex');
            /* set value, to be able to decrypt data */
            this.setDataValue('init_vector', iv.toString('hex'));
            /* set value, to be able to decrypt data */
            this.setDataValue('auth_tag', cipher.getAuthTag().toString('hex'));
            /* set encrypted message */
            this.setDataValue('msg', result);
        }
    }
    /**
     * Automatically encrypts message if not encrypted before.
     *
     * @returns the stored message
     */
    get message() {
        const encryptedData = this.getDataValue('msg');
        const iv = this.initVector;
        /* if not encrypted, encrypt */
        if (!iv) {
            this.encrypt(encryptedData);
            return encryptedData; // This value is not encrypted
        }
        const decipher = crypto.createDecipheriv(process.env.CRYPTO_ALG, Buffer.from(process.env.CRYPTO_KEY), Buffer.from(iv, 'hex'));
        decipher.setAuthTag(Buffer.from(this.authTag, 'hex'));
        /* decipher data and return */
        return decipher.update(encryptedData, 'hex', 'utf-8')
            + decipher.final('utf-8');
    }
}
exports.default = Chat;
/**
 * ORM model for the Chat table.
 * Immutable.
 *
 * >- chat_id: primary key to distinguish chat logs.
 * >- chat_timestamp: when the message was sent.
 * >- chat_sender: ID of the sending user.
 * >- session_id: foreign key for the session that owns the chat message.
 * >- chat_receiver?: ID of the receiver. If undefined, all users receive the message.
 * >- msg: message sent by the user.
 */
Chat.init({
    chat_id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    session_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    chat_sender: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    chat_receiver: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null
    },
    init_vector: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    auth_tag: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    msg: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    chat_timestamp: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.Sequelize.fn('now'),
    }
}, {
    timestamps: false,
    hooks: {
        beforeValidate(chat) {
            return __awaiter(this, void 0, void 0, function* () {
                /* encrypt the data */
                chat.message;
            });
        }
    },
    sequelize: database_1.database,
    modelName: 'Chat'
});
/**
 * Each chat message belongs has a creator.
 */
Chat.belongsTo(User_1.default, {
    as: 'sender',
    foreignKey: 'chat_sender',
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
});
/**
 * Each chat message may or may not have a receiver.
 */
Chat.belongsTo(User_1.default, {
    as: 'receiver',
    foreignKey: 'chat_receiver',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});
