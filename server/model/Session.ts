import {DataTypes, Model, NonAttribute, Sequelize} from "sequelize";
import {database} from "../database";
import User from "./User";
import 'dotenv/config';
import Chat from "./Chat";
import SessionAttendee from "./SessionAttendee";
import bcrypt from "bcrypt";
import {getUser} from "../services/UserService";


/**
 * @returns a random salt
 */
function generateSalt(): string {
    return bcrypt.genSaltSync();
}

/**
 * @param value to be hashed
 * @param salt added to the hash
 * @returns the hashed value
 */
function hash(value: string, salt: string): string {
    return bcrypt.hashSync(value, salt + process.env.DB_PEPPER);
}

/**
 * Interface for the session model. Provides type context.
 */
interface SessionAttributes {
    session_id: number,
    session_salt: string,
    is_chat: boolean,
    session_password: string,
    session_creator: number,
    session_duration: number,
    session_created_at: Date,
}

/**
 * Type alias for session creation attribute type.
 */
type SessionCreationAttributes = {
    session_password: string,
    session_creator: number,
    is_chat: boolean
};

// noinspection JSAnnotator (disables a false error)
/**
 * Session class declaration.
 * Useful for handling instances of type Session and defining
 * helper functions.
 */
export default class Session extends Model<SessionAttributes, SessionCreationAttributes> {
    /**
     * @param rawValue raw string (un-hashed, usually a password).
     * @returns hashed string.
     * @private
     */
    private hash(rawValue: string): string {
        return hash(rawValue, this.salt as string);
    }

    /**
     * @returns the session ID
     */
    public get sessionId(): NonAttribute<number> {
        return this.getDataValue('session_id');
    }

    /**
     * @returns true if the session is only a chatting session.
     */
    public get isChat(): NonAttribute<boolean> {
        return this.getDataValue('is_chat');
    }

    /**
     * @returns session salt
     */
    public get salt(): NonAttribute<string> {
        return this.getDataValue('session_salt');
    }

    /**
     * @param rawPassword new password, un-hashed.
     */
    public setPassword(rawPassword: string): void {
        this.setDataValue(
            'session_password',
            this.hash(rawPassword)
        );
    }

    /**
     * @returns the session creator ID
     */
    public get sessionCreatorId(): NonAttribute<number> {
        return this.getDataValue('session_creator');
    }

    /**
     * @returns the hashed session password
     */
    public get password(): NonAttribute<string> {
        return this.getDataValue('session_password');
    }

    /**
     * Creates session salt. Iff the session does not have one.
     */
    public setSalt(): void {
        if (!this.salt) {
            this.setDataValue('session_salt', generateSalt());
        }
    }

    /**
     * @returns the session duration in milliseconds.
     */
    public get sessionDuration(): NonAttribute<number> {
        return this.getDataValue('session_duration');
    }

    /**
     * @returns the timestamp on which the session was created.
     */
    public get createdAt(): NonAttribute<Date> {
        return this.getDataValue('session_created_at');
    }

    /**
     * @returns user email of user is valid.
     *          Otherwise, undefined.
     */
    public async getCreatorEmail(): Promise<string | undefined> {
        return (await getUser(this.sessionCreatorId)).result?.email;
    }

    /**
     * @returns true if the session has ended.
     */
    public get hasEnded(): NonAttribute<boolean> {
        return this.sessionDuration !== -1;
    }

    /**
     * Ends the session, updates the duration.
     */
    public endSession(): void {
        this.setDataValue('session_duration', new Date().getTime() - this.createdAt.getTime());
    }
}

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
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    is_chat: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    session_creator: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    session_password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    session_salt: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    session_duration: {
        type: DataTypes.INTEGER,
        defaultValue: -1,
    },
    session_created_at: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.fn('now'),
    }
}, {
    initialAutoIncrement: "1000",
    timestamps: false,
    hooks: {
        async beforeValidate(session: Session) {
            /* generate salt */
            session.setSalt();

            /* Password here is still un-hashed, thus we set it */
            session.setPassword(session.password);
        }
    },
    sequelize: database,
    modelName: 'Session'
});

/**
 * Each session belongs has a creator.
 */
Session.belongsTo(User, {
    foreignKey: 'session_creator',
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
});

/**
 * Each session has many chat messages.
 */
Session.hasMany(Chat, {
    foreignKey: 'session_id',
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
});

/**
 * Each session has many attendees & each user can attend multiple sessions
 * (not necessarily simultaneous sessions).
 */
Session.belongsToMany(User, {through: SessionAttendee});
User.belongsToMany(Session, {through: SessionAttendee});
