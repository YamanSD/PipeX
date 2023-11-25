/**
 * Provides CRUD operations for the Session table.
 */
import {Session, User} from "../model";
import Response from "./Response";
import {handleError, Result} from "./helpers";
import 'dotenv/config';
import jwt, {Secret} from "jsonwebtoken";
import {getUser} from "./UserService";


/**
 * @param session to generate token for.
 * @returns session token, used by users to access the session.
 *          Users view this token as the ID.
 */
function generateToken(session: Session): string {
    return jwt.sign({
        id: session.sessionId,
        password: session.password
    }, process.env.JWT_S_SECRET as Secret, {
            expiresIn: process.env.JWT_S_EXPIRY
        }
    );
}

/**
 * Type alias for the verification response of the JWT.verify function.
 */
type JwtVerifyResponse = {
    iat?: number,
    exp?: number,
    id: number,
    password: string
};

/**
 * @param token JWT token to be verified
 * @param container result returned to this container
 * @returns the session ID and password if the token is valid.
 *          Otherwise, undefined.
 */
async function verifyToken(token: string,
                                  container: { sessionId: number | null, password: string | null }): Promise<void> {
    return new Promise<void>((resolve) => {
        jwt.verify(token, process.env.JWT_S_SECRET as Secret,
            (err, session) => {
                session = session as JwtVerifyResponse;

                /* either we have an error, empty response, no id, no password, or expired */
                if (err || !session || !session.id || !session.password
                    || !session.exp || session.exp <= 0) {
                    container.sessionId = null;
                    container.password = null;
                    resolve()
                    return;
                }

                container.sessionId = session.id;
                container.password = session.password;
                resolve();
            }
        );
    });
}

/**
 * @param creatorEmail of the user creating the session
 * @param password of the session
 * @param isChat true indicates chat only session
 * @returns the Session token if successful.
 */
export async function createSession(
    creatorEmail: string,
    password: string,
    isChat: boolean
): Result<{sessionToken: string, sessionId: number}> {
    try {
        const creatorRes = await getUser(creatorEmail);

        /* check for any errors */
        if (creatorRes.response !== Response.SUCCESS) {
            return {
                response: creatorRes.response,
                err: `${creatorRes.err} :user: ${creatorEmail}`
            };
        }

        /* get creator ID */
        const creatorId = (creatorRes.result as User).uid;

        /* create session */
        const session = await Session.create({
            session_creator: creatorId,
            session_password: password,
            is_chat: isChat
        });

        if (!session) {
            return {
                response: Response.INVALID_IN,
                err: "Could not create session"
            }
        }

        return {
            result: {
                sessionToken: generateToken(session),
                sessionId: session.sessionId
            },
            response: Response.SUCCESS
        };
    } catch (e) {
        return handleError(e);
    }
}

/**
 * @param sessionId ID of the session to get.
 * @returns the session belonging to the ID.
 */
export async function getSession(sessionId: number): Result<Session> {
    try {
        const session: Session | null = await Session.findByPk(sessionId);

        if (!session) {
            /* does not exist */
            return {
                response: Response.NOT_EXIST
            };
        }

        return {
            response: Response.SUCCESS,
            result: session
        };
    } catch (e) {
        return handleError(e);
    }
}

/**
 * @param uid to get sessions for.
 * @returns a list of session IDs of the user.
 */
export async function getUserSessions(uid: number): Result<number[]> {
    try {
        const sessions = await Session.findAll({
            where: {
                session_creator: uid
            },
            attributes: ['session_id']
        });

        return {
            response: Response.SUCCESS,
            result: sessions.map(s => s.sessionId)
        };
    } catch (e) {
        return handleError(e);
    }
}

/**
 * @param token session token to verify.
 * @returns the session belonging to the token if valid
 */
export async function verifySession(token: string): Result<Session> {
    try {
        let container: {
            sessionId: number | null,
            password: string | null
        } = { sessionId: null, password: null };

        await verifyToken(token, container);

        /* check token parameters */
        if (container.sessionId === null || container.password === null) {
            return {
                response: Response.INVALID_IN,
                err: "Invalid session ID"
            };
        }

        /* get session */
        const sessionRes = await getSession(container.sessionId);

        /* check session */
        if (sessionRes.response !== Response.SUCCESS || sessionRes.result === undefined) {
            return {
                response: sessionRes.response,
                err: sessionRes.err
            };
        }

        /* session instance */
        const session = sessionRes.result;

        if (session.password !== container.password) {
            return {
                response: Response.INVALID_IN,
                err: "Invalid session password"
            };
        }

        return {
            response: Response.SUCCESS,
            result: session
        }
    } catch (e) {
        return handleError(e);
    }
}

/**
 * @param session to be updated.
 * @returns response code.
 */
export async function updateSession(session: Session): Result {
    try {
        await session.save();

        return {
            response: Response.SUCCESS,
        };
    } catch (e) {
        return handleError(e);
    }
}
