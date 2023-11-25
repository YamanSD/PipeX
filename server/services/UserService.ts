/**
 * Provides CRUD operations for the User table.
 */
import {User} from "../model";
import Response from "./Response";
import jwt, {Secret} from "jsonwebtoken";
import {handleError, Result} from "./helpers";
import 'dotenv/config';

/**
 * @param email email of the user
 * @param password password of the user
 * @param admin if true the user is an admin
 * @returns if successful, new User is returned.
 *          Otherwise, reason of error & error.
 */
export async function createUser(email: string,
                                 password: string,
                                 admin?: boolean): Result<User> {
    try {
        return {
            result: await User.create({
                user_email: email,
                user_password: password,
                is_admin: admin
            }),
            response: Response.SUCCESS
        };
    } catch (e) {
        return handleError(e);
    }
}

/**
 * @param user modified user, saved to database.
 */
export async function updateUser(user: User): Result {
    try {
        await user.save();

        return {
            response: Response.SUCCESS
        };
    } catch (e) {
        return handleError(e);
    }
}

/**
 * @param identifier of the user
 * @returns the user belonging to the identifier
 */
export async function getUser(identifier: string | number): Result<User> {
    try {
        /* holds user value */
        let user: User | null;

        if (typeof identifier === 'string') {
            user = await User.findOne({
                where: {
                    user_email: identifier.toLowerCase()
                }
            });
        } else {
            user = await User.findByPk(identifier);
        }

        if (!user) {
            if (identifier === process.env.SU_EMAIL) {
                /* create superuser */
                const temp = await superUser();

                if (temp.response === Response.SUCCESS) {
                    return getUser(identifier); // Retry after creation
                }

                /* internal error for some reason */
                return {
                    response: Response.INTERNAL,
                    err: temp.err
                };
            }

            return {
                response: Response.NOT_EXIST
            };
        }

        return {
            response: Response.SUCCESS,
            result: user
        };
    } catch (e) {
        return handleError(e);
    }
}

/**
 * @returns all users
 */
export async function getAllUsers(): Result<User[]> {
    try {
        return {
            response: Response.SUCCESS,
            result: await User.findAll()
        };
    } catch (e) {
        return handleError(e);
    }
}

/**
 * @param email of the user to be deleted
 */
export async function deleteUser(email: string): Result {
    try {
        /* make sure nobody deletes the superuser */
        if (email === process.env.SU_EMAIL as string) {
            return {
                response: Response.INVALID_IN,
                err: "Super cannot be deleted"
            };
        }

        const user: User | undefined = (await getUser(email)).result;

        if (!user) {
            return {
                response: Response.NOT_EXIST
            };
        }

        await user.destroy();

        return {
            response: Response.SUCCESS
        };
    } catch (e) {
        return handleError(e);
    }
}

/**
 * @param email of the user to be banned\
 * @param status of the user (true banned, false unbanned)
 */
export async function setBanUser(email: string, status: boolean): Result {
    try {
        const user: User | undefined = (await getUser(email)).result;

        if (!user) {
            return {
                response: Response.NOT_EXIST
            };
        }

        user.setStatus(status);
        await updateUser(user);

        return {
            response: Response.SUCCESS
        };
    } catch (e) {
        return handleError(e);
    }
}

/**
 * Creates superuser if it does not exist
 * @returns the superuser
 */
export async function superUser(): Result<User> {
    const suEmail: string = process.env.SU_EMAIL as string;
    const suPass: string = process.env.SU_PASS as string;

    let response = await getUser(suEmail);

    /* check if user exists */
    if (response.response === Response.SUCCESS) {
        return {
            response: Response.SUCCESS,
            result: response.result as User
        };
    }

    /* create superuser */
    response = await createUser(
        suEmail,
        suPass,
        true
    );

    /* check if creation failed */
    if (response.response !== Response.SUCCESS) {
        return {
            response: Response.INTERNAL,
            err: response.err
        };
    }

    return {
        response: Response.SUCCESS,
        result: response.result as User
    };
}

/**
 * @param email of the user
 * @param password of the user
 * @returns true if the user is genuine.
 */
async function authenticate(email: string, password: string): Result<boolean> {
    try {
        const user: User | undefined = (await getUser(email)).result;

        if (!user) {
            return {
                response: Response.NOT_EXIST
            };
        }

        return {
            result: !user.isBanned && user.isValidPassword(password),
            response: Response.SUCCESS
        };
    } catch (e) {
        return handleError(e);
    }
}

/**
 * Type alias for the token generation payload.
 */
type PayloadType = {
    email: string
};

/**
 * @param email of the user
 * @param password of the user
 * @returns a JWT token if the email-password pair are valid.
 *          Otherwise, undefined.
 */
export async function generateToken(email: string, password: string): Promise<string | null> {
    /* in case the user provided an upper case email */
    email = email.toLowerCase();

    const authResponse = await authenticate(email, password);

    if (authResponse.response === Response.SUCCESS && authResponse.result) {
        return jwt.sign(
            {email}, // PayloadType
            process.env.JWT_SECRET as Secret,
            {
                expiresIn: process.env.JWT_EXPIRY
            }
        );
    } else {
        return null;
    }
}

/**
 * Type alias for the verification response of the JWT.verify function.
 * Merged with the PayloadType.
 */
type JwtVerifyResponse = {
    iat?: number,
    exp?: number
} & PayloadType;

/**
 * @param token JWT token to be verified
 * @param container result returned to this container
 * @returns the user (owner of token) ID if the token is valid.
 *          Otherwise, undefined.
 */
export async function verifyToken(token: string, container: { uid: string | null }): Promise<void> {
    /* note that we can provide fine-grained control of reasons of error */
    return new Promise<void>((resolve) => {
        jwt.verify(token, process.env.JWT_SECRET as Secret,
            (err, user) => {
                /* this is the actual form of the response */
                user = user as JwtVerifyResponse;

                /* either we have an error, empty response, no email, or expired */
                if (err || !user || !user.email || !user.exp || user.exp <= 0) {
                    container.uid = null;
                    resolve();
                    return;
                }

                container.uid = user.email;
                resolve();
        });
    });
}
