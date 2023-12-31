import {DataTypes, Model, NonAttribute, Optional} from "sequelize";
import {database} from "../database";
import bcrypt from "bcrypt";
import 'dotenv/config';

/**
 * @returns a random salt
 */
function generateSalt(): string {
    return bcrypt.genSaltSync();
}

/**
 * Interface for the user model. Provides type context.
 */
interface UserAttributes {
    uid: number,
    user_email: string,
    user_password: string,
    user_salt: string,
    is_banned: boolean,
    is_admin: boolean
}

/**
 * Type alias for user creation attribute type.
 */
type UserCreationAttributes = Optional<
    Optional<
        Optional<
            Optional<
                UserAttributes,
                'uid'
            >,
            'user_salt'
        >,
        'is_admin'
    >,
    'is_banned'
>;

// noinspection JSAnnotator (disables a false error)
/**
 * User class declaration.
 * Useful for handling instances of type User and defining
 * helper functions.
 */
export default class User extends Model<UserAttributes, UserCreationAttributes> {
    /**
     * @param rawValue raw string (un-hashed, usually a password).
     * @returns hashed string.
     * @private
     */
    private hash(rawValue: string): string {
        return bcrypt.hashSync(rawValue, this.salt + process.env.DB_PEPPER);
    }

    /**
     * @returns user ID.
     */
    public get uid(): NonAttribute<number> {
        return this.getDataValue('uid');
    }

    /**
     * @returns user email
     */
    public get email(): NonAttribute<string> {
        return this.getDataValue('user_email');
    }

    /**
     * @returns hashed user password
     */
    public get password(): NonAttribute<string> {
        return this.getDataValue('user_password');
    }

    /**
     * @param rawPassword new password, un-hashed.
     */
    public setPassword(rawPassword: string): void {
        this.setDataValue(
            'user_password',
            this.hash(rawPassword)
        );
    }

    /**
     * @returns true if the user is banned
     */
    public get isBanned(): NonAttribute<boolean> {
        return this.getDataValue('is_banned');
    }

    /**
     * @returns user salt
     */
    public get salt(): NonAttribute<string> {
        return this.getDataValue('user_salt');
    }

    /**
     * @returns true if the user is an admin
     */
    public get isAdmin(): NonAttribute<boolean> {
        return this.getDataValue('is_admin');
    }

    /**
     * @returns export data for the user to be sent over the internet
     */
    public get export(): NonAttribute<any> {
        return {
          user_email: this.email,
          is_banned: this.isBanned,
          is_admin: this.isAdmin,
        };
    }

    /**
     * Creates user salt. Iff the user does not have one.
     */
    public setSalt(): void {
        if (!this.salt) {
            this.setDataValue('user_salt', generateSalt());
        }
    }

    /**
     * @param rawPassword un-hashed password to check if valid
     * @returns true if the password matches the stored user password
     */
    public isValidPassword(rawPassword: string): boolean {
        return this.hash(rawPassword) === this.password;
    }

    /**
     * @param banned status of the user
     */
    public setStatus(banned: boolean): void {
        this.setDataValue('is_banned', banned);
    }

    /**
     * @param email new user email
     */
    public setEmail(email: string): void {
        this.setDataValue('user_email', email.toLowerCase());
    }
}

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
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_email: {
        type: DataTypes.STRING,
        unique: true,
        validate: {
            isEmail: true
        },
    },
    user_password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    user_salt: {
        type: DataTypes.STRING,
        allowNull: false
    },
    is_banned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    is_admin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    hooks: {
        async beforeValidate(user: User) {
            /* generate salt */
            user.setSalt();

            /* set emails to lowercase */
            user.setEmail(user.email);

            /* Password here is still un-hashed, thus we set it */
            user.setPassword(user.password);
        }
    },
    sequelize: database,
    modelName: 'User'
});
