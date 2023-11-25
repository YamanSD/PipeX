import {DataTypes, Model, NonAttribute, Sequelize} from "sequelize";
import {database} from "../database";
import * as crypto from "crypto";
import User from "./User";
import 'dotenv/config';
import {CipherGCM, DecipherGCM} from "crypto";


/**
 * Interface type for the ChatLog model.
 */
interface ChatAttributes {
    chat_id: number;
    session_id: number;
    init_vector: string;
    auth_tag: string;
    chat_timestamp: Date;
    chat_sender: number;
    chat_receiver: number;
    msg: string;
}

/**
 * Used for the creation of a new chat.
 */
type ChatCreationAttributes = {
    chat_sender: number,
    session_id: number,
    msg: string,
    chat_receiver: number | null,
};

// noinspection JSAnnotator (disables a false error)
/**
 * Chat class declaration.
 * Useful for handling instances of type Chat and defining
 * helper functions.
 */
export default class Chat extends Model<ChatAttributes, ChatCreationAttributes> {
    /**
     * @returns the chat ID
     */
    public get chatId(): NonAttribute<number> {
        return this.getDataValue('chat_id');
    }

    /**
     * @returns the session ID
     */
    public get sessionId(): NonAttribute<number> {
        return this.getDataValue('session_id');
    }

    /**
     * @returns the timestamp of the message
     */
    public get timestamp(): NonAttribute<number> {
        return this.getDataValue('chat_timestamp').getTime();
    }

    /**
     * @returns the sending user's ID
     */
    public get senderId(): NonAttribute<number> {
        return this.getDataValue('chat_sender');
    }

    /**
     * @returns the initialization used in chat encryption.
     */
    public get initVector(): NonAttribute<string> {
        return this.getDataValue('init_vector');
    }

    /**
     * @returns the auth tag used in chat encryption.
     */
    public get authTag(): NonAttribute<string> {
        return this.getDataValue('auth_tag');
    }

    /**
     * @returns the receiving user's ID if present, else null
     */
    public get receiverId(): NonAttribute<number | null> {
        return this.getDataValue('chat_receiver');
    }

    /**
     * Encrypts the message chat, iff it has never been encrypted before.
     *
     * @param message to be encrypted.
     */
    private encrypt(message: string): void {
        /* make sure we haven't encrypted the data before */
        if (!this.initVector) { // Should be undefined to start
            /* initialization vector of random bytes */
            const iv = crypto.randomBytes(16);

            /* cipher object */
            const cipher = crypto.createCipheriv(
                process.env.CRYPTO_ALG as string,
                Buffer.from(process.env.CRYPTO_KEY as string),
                iv
            ) as CipherGCM;

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
    public get message(): NonAttribute<string> {
        const encryptedData: string = this.getDataValue('msg');
        const iv: string = this.initVector;

        /* if not encrypted, encrypt */
        if (!iv) {
            this.encrypt(encryptedData);
            return encryptedData; // This value is not encrypted
        }

        const decipher = crypto.createDecipheriv(
            process.env.CRYPTO_ALG as string,
            Buffer.from(process.env.CRYPTO_KEY as string),
            Buffer.from(iv, 'hex')
        ) as DecipherGCM;

        decipher.setAuthTag(Buffer.from(this.authTag, 'hex'));

        /* decipher data and return */
        return decipher.update(encryptedData, 'hex', 'utf-8')
            + decipher.final('utf-8');
    }
}

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
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    session_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    chat_sender: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    chat_receiver: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null
    },
    init_vector: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    auth_tag: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    msg: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    chat_timestamp: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.fn('now'),
    }
}, {
    timestamps: false,
    hooks: {
        async beforeValidate(chat: Chat) {
            /* encrypt the data */
            chat.message;
        }
    },
    sequelize: database,
    modelName: 'Chat'
});

/**
 * Each chat message belongs has a creator.
 */
Chat.belongsTo(User, {
    as: 'sender',
    foreignKey: 'chat_sender',
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
});

/**
 * Each chat message may or may not have a receiver.
 */
Chat.belongsTo(User, {
    as: 'receiver',
    foreignKey: 'chat_receiver',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});
