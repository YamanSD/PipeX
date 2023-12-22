/**
 * Serves session requests.
 * Responsible for session listeners.
 */
import {Request, Response} from 'express';
import {AttendeeService, ChatService, ServiceResponse, SessionService, UserService} from '../services';
import Http from "./Http";
import {handleBadListener, handleBadRes, verifyToken} from "./helpers";
import {Session} from "../model";
import {Server, Socket} from "socket.io";
import {RoomHandle, SocketEvent} from "../sockets";
import {JoinArgs, LeaveArgs, MessageArgs, PrefArgs, ReadyArgs} from "../sockets/RoomHandle";


/**
 * Type alias for req parameter of the get session function
 */
type GetSessionRequest = Request<
    {token: string}, // Header parameters
    {session: Session, chat: ChatService.ExportChat[], attendees: {UserUid: number}[]}, // Response body
    {sessionToken: string | number}, // Request body
    {} // Request query
>;

/**
 * Used to retrieve session information.
 *
 * @param req HTTP request containing owner token in the header.
 * @param res HTTP response containing session & its chat log in the body.
 * @returns res with the appropriate code and the data
 */
export async function getSession(
    req: GetSessionRequest,
    res: Response): Promise<Response> {
    return verifyToken(req, res, async (user) => {
        const {sessionToken} = req.body;
        const temp = typeof sessionToken === 'number'
            ? await SessionService.getSession(sessionToken)
            : await SessionService.verifySession(sessionToken);

        /* check if response is not successful */
        if (temp.response !== ServiceResponse.SUCCESS) {
            return handleBadRes(res, temp.response, temp.err);
        }

        const session = temp.result as Session;

        /* check if owner matches person requesting */
        if (session.sessionCreatorId !== user.uid) {
            return res.status(Http.UNAUTHORIZED).json();
        }

        /* fetch chats */
        const chats = await ChatService.getSessionChat(session.sessionId, user.uid);

        /* if fetching chats failed for some reason */
        if (chats.response !== ServiceResponse.SUCCESS) {
            return handleBadRes(res, chats.response, chats.err);
        }

        const attendeeRes = await AttendeeService.getAttendees(session.sessionId);

        /* if fetching attendees failed for some reason */
        if (attendeeRes.response !== ServiceResponse.SUCCESS) {
            return handleBadRes(res, attendeeRes.response, attendeeRes.err);
        }

        return res.status(Http.OK).json({
            session: {
                sessionNumber: session.sessionId,
                sessionDuration: session.sessionDuration,
                createdAt: session.createdAt
            },
            chat: chats.result,
            attendees: attendeeRes.result as {UserUid: number}[]
        });
    });
}

/**
 * Type alias for req parameter of the get user session function
 */
type GetUserSessionRequest = Request<
    {token: string}, // Header parameters
    {sessionIds: number[]}, // Response body
    {}, // Request body
    {} // Request query
>;

/**
 * Used to retrieve user sessions.
 *
 * @param req HTTP request containing owner token in the header.
 * @param res HTTP response containing user session IDs.
 * @returns res with the appropriate code and the data
 */
export async function getUserSessions(
    req: GetUserSessionRequest,
    res: Response): Promise<Response> {
    return verifyToken(req, res, async (user) => {
        const sessions = await SessionService.getUserSessions(user.uid);

        if (sessions.response !== ServiceResponse.SUCCESS) {
            return handleBadRes(res, sessions.response, sessions.err);
        }

        return res.status(Http.OK).json({
            sessionIds: sessions.result
        });
    });
}

/**
 * Type alias for request parameters of create session listener.
 */
type CreateSessionRequest = {
    uid: string,
    token: string,
    sessionPassword: string,
    isChat: boolean
};

/**
 * @param email to check.
 * @param token to check.
 *
 * @returns true if the token is valid and the email matches the token.
 */
async function checkUserToken(email: string, token: string): Promise<boolean> {
    const userRes = await UserService.getUser(email);

    /* user does not exist */
    if (userRes.response !== ServiceResponse.SUCCESS || !userRes.result) {
        return false;
    }

    /* verify token */
    const container: {uid: null | string} = {uid: null};
    await UserService.verifyToken(token, container);

    return container.uid === userRes.result.email;
}

/**
 * Called on a user socket.
 * Attaches all listeners to the socket.
 *
 * @param io socket.io server instance.
 * @param socket to attach listeners to.
 */
export function attachListeners(io: Server, socket: Socket) {
    onCreateListener(io, socket);
    onJoinListener(io, socket);
    onTerminateListener(io, socket);
    onLeaveListener(io, socket);
    onPreferenceListener(io, socket);
    onMessageListener(io, socket);
    onReadyListener(io, socket);
    onTranscriptListener(io, socket);
}

/**
 * @param io socket.io server.
 * @param socket socket instance.
 */
function onCreateListener(io: Server, socket: Socket) {
    socket.on(SocketEvent.CREATE, async (argsList: CreateSessionRequest, callback: (args: {
        response: Http,
        err?: unknown,
        result?: any
    }) => any = () => {}) => {
        /* token is user token */
        const {token, uid, sessionPassword, isChat} = argsList;

        /* check for missing data */
        if (!token || !uid || !sessionPassword) {
            callback({
                response: Http.BAD,
                err: "missing token, uid, and/or session password"
            });
            return;
        }

        if (!(await checkUserToken(uid, token))) {
            callback({
                response: Http.UNAUTHORIZED,
                err: "User token mismatch"
            });
            return;
        }

        const temp = await SessionService.createSession(uid, sessionPassword, isChat);

        /* if session creation failed */
        if (temp.response !== ServiceResponse.SUCCESS || !temp.result) {
            callback(handleBadListener(temp.response, temp.err));
            return;
        }

        /* generated session ID */
        const {sessionToken, sessionId} = temp.result;

        /* create room listener */
        RoomHandle.createListener(
            io, socket, token, uid, sessionPassword,
            sessionId, sessionToken, callback, isChat
        );

        /* inform user. Triggered iff not triggered in RoomHandle constructor */
        callback({ response: Http.OK, result: sessionToken });
    });
}

/**
 * @param io socket.io server.
 * @param socket socket instance.
 */
function onLeaveListener(io: Server, socket: Socket) {
    socket.on(SocketEvent.LEAVE, async (argsList: LeaveArgs, callback: (args: {
        response: Http,
        err?: unknown,
        result?: any
    }) => any = () => {}) => {
        const {uid, sessionToken} = argsList;

        /* check for missing data */
        if (!uid) {
            callback({
                response: Http.BAD,
                err: "missing uid"
            });
            return;
        }

        /* get listener */
        const listener = RoomHandle.getListener(sessionToken);

        /* check listener */
        if (!listener) {
            callback({
                response: Http.NOT_FOUND,
                err: "session does not exist or has ended"
            });
            return;
        }

        /* try to join the session, calls callback in case of failure or success */
        await listener.onLeave(sessionToken, socket, argsList, callback);

        if (listener.isEmpty) {
            const temp = await SessionService.verifySession(sessionToken);

            /* if session creation failed */
            if (temp.response !== ServiceResponse.SUCCESS) {
                return;
            }

            /* get session */
            const session = temp.result as Session;

            session.endSession();
            const upRes = await SessionService.updateSession(session);

            if (upRes.response !== ServiceResponse.SUCCESS) {
                return;
            }

            /* terminate session */
            RoomHandle.terminateListener(socket, sessionToken);
        }
    });
}

/**
 * @param io socket.io server.
 * @param socket socket instance.
 */
function onPreferenceListener(io: Server, socket: Socket) {
    socket.on(SocketEvent.PREFERENCE, async (argsList: PrefArgs, callback: (args: {
        response: Http,
        err?: unknown,
        result?: any
    }) => any = () => {}) => {
        const {uid, sessionToken} = argsList;

        /* check for missing data */
        if (!uid || !sessionToken) {
            callback({
                response: Http.BAD,
                err: "missing uid and/or session ID"
            });
            return;
        }

        /* get listener */
        const listener = RoomHandle.getListener(sessionToken);

        /* check listener */
        if (!listener) {
            callback({
                response: Http.NOT_FOUND,
                err: "session does not exist or has ended"
            });
            return;
        }

        /* try to join the session, calls callback in case of failure or success */
        listener.onPreference(socket, argsList, callback);
    });
}

/**
 * @param io socket.io server.
 * @param socket socket instance.
 */
function onMessageListener(io: Server, socket: Socket) {
    socket.on(SocketEvent.MSG, async (argsList: MessageArgs, callback: (args: {
        response: Http,
        err?: unknown,
        result?: any
    }) => any = () => {}) => {
        const {message, sender, sessionToken, token} = argsList;

        /* check for missing data */
        if (!message || !sender || !sessionToken || !token) {
            callback({
                response: Http.BAD,
                err: "missing sender, message, token, and/or session ID"
            });
            return;
        }

        const isValidUser = await checkUserToken(sender, token);

        /* check if token is valid */
        if (!isValidUser) {
            callback({
                response: Http.UNAUTHORIZED,
                err: "Invalid token"
            });
            return;
        }

        /* get listener */
        const listener = RoomHandle.getListener(sessionToken);

        /* check listener */
        if (!listener) {
            callback({
                response: Http.NOT_FOUND,
                err: "session does not exist or has ended"
            });
            return;
        }

        /* try to join the session, calls callback in case of failure or success */
        await listener.onMessage(socket, argsList, callback);
    });
}

/**
 * @param io socket.io server.
 * @param socket socket instance.
 */
function onTranscriptListener(io: Server, socket: Socket) {
    socket.on(SocketEvent.TRANSCRIPT, async (argsList: MessageArgs, callback: (args: {
        response: Http,
        err?: unknown,
        result?: any
    }) => any = () => {}) => {
        const {message, sender, sessionToken, token} = argsList;

        /* check for missing data */
        if (!message || !sender || !sessionToken || !token) {
            callback({
                response: Http.BAD,
                err: "missing sender, message, token, and/or session ID"
            });
            return;
        }

        const isValidUser = await checkUserToken(sender, token);

        /* check if token is valid */
        if (!isValidUser) {
            callback({
                response: Http.UNAUTHORIZED,
                err: "Invalid token"
            });
            return;
        }

        /* get listener */
        const listener = RoomHandle.getListener(sessionToken);

        /* check listener */
        if (!listener) {
            callback({
                response: Http.NOT_FOUND,
                err: "session does not exist or has ended"
            });
            return;
        }

        /* try to join the session, calls callback in case of failure or success */
        await listener.onTranscript(socket, argsList.message, argsList.sender, callback);
    });
}

/**
 * @param io socket.io server.
 * @param socket socket instance.
 */
function onJoinListener(io: Server, socket: Socket) {
    socket.on(SocketEvent.JOIN, async (argsList: JoinArgs, callback: (args: {
        response: Http,
        err?: unknown,
        result?: any
    }) => any = () => {}) => {
        const {token, uid, sessionToken, password} = argsList;

        /* check for missing data */
        if (!token || !uid || !password || !sessionToken) {
            callback({
                response: Http.BAD,
                err: "missing token, uid, session password, and/or session ID"
            });
            return;
        }

        if (!(await checkUserToken(uid, token))) {
            callback({
                response: Http.UNAUTHORIZED,
                err: "User token mismatch"
            });
            return;
        }

        /* get listener */
        const listener = RoomHandle.getListener(sessionToken);

        /* check listener */
        if (!listener) {
            callback({
                response: Http.NOT_FOUND,
                err: "session does not exist or has ended"
            });
            return;
        }

        /* try to join the session, calls callback in case of failure or success */
        await listener.onJoin(socket, argsList, callback);
    });
}

/**
 * @param io socket.io server.
 * @param socket socket instance.
 */
function onReadyListener(io: Server, socket: Socket) {
    socket.on(SocketEvent.READY, async (argsList: ReadyArgs, callback: (args: {
        response: Http,
        err?: unknown,
        result?: any
    }) => any = () => {}) => {
        const {token, uid, sessionToken} = argsList;

        /* check for missing data */
        if (!token || !uid || !sessionToken) {
            callback({
                response: Http.BAD,
                err: "missing token, uid, session password, and/or session ID"
            });
            return;
        }

        if (!(await checkUserToken(uid, token))) {
            callback({
                response: Http.UNAUTHORIZED,
                err: "User token mismatch"
            });
            return;
        }

        /* get listener */
        const listener = RoomHandle.getListener(sessionToken);

        /* check listener */
        if (!listener) {
            callback({
                response: Http.NOT_FOUND,
                err: "session does not exist or has ended"
            });
            return;
        }

        /* try to join the session, calls callback in case of failure or success */
        await listener.onReady(socket, argsList, callback);
    });
}

/**
 * Type alias for request parameters of terminate session listener.
 */
type TerminateSessionRequest = {
    uid: string,
    token: string,
    sessionToken: string
};

/**
 * @param io socket.io server.
 * @param socket socket instance.
 */
function onTerminateListener(io: Server, socket: Socket) {
    socket.on(SocketEvent.TERMINATE, async (argsList: TerminateSessionRequest, callback: (args: {
        response: Http,
        err?: unknown,
        result?: any
    }) => any = () => {}) => {
        const {token, sessionToken, uid} = argsList;

        /* check for missing data */
        if (!token || !uid || !sessionToken) {
            callback({
                response: Http.BAD,
                err: "missing token, session ID, and/or creator email"
            });
            return;
        }

        if (!(await checkUserToken(uid, token))) {
            callback({
                response: Http.UNAUTHORIZED,
                err: "User token mismatch"
            });
            return;
        }

        const temp = await SessionService.verifySession(sessionToken);

        /* if session creation failed */
        if (temp.response !== ServiceResponse.SUCCESS) {
            callback(handleBadListener(temp.response, temp.err));
            return;
        }

        /* get session */
        const session = temp.result as Session;

        /* creator email of the session */
        const creatorEmail = await session.getCreatorEmail();

        /* check owner */
        if (creatorEmail === undefined || creatorEmail !== uid) {
            callback({ response: Http.UNAUTHORIZED, err: "Invalid creator" });
            return;
        }

        session.endSession();
        const upRes = await SessionService.updateSession(session);

        if (upRes.response !== ServiceResponse.SUCCESS) {
            callback({ response: Http.BAD, err: upRes.err });
            return;
        }

        /* inform user */
        callback( { response: Http.OK });

        /* terminate session */
        RoomHandle.terminateListener(socket, sessionToken);
    });
}
