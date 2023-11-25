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
exports.attachListeners = exports.getUserSessions = exports.getSession = void 0;
const services_1 = require("../services");
const Http_1 = __importDefault(require("./Http"));
const helpers_1 = require("./helpers");
const sockets_1 = require("../sockets");
/**
 * Used to retrieve session information.
 *
 * @param req HTTP request containing owner token in the header.
 * @param res HTTP response containing session & its chat log in the body.
 * @returns res with the appropriate code and the data
 */
function getSession(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        return (0, helpers_1.verifyToken)(req, res, (user) => __awaiter(this, void 0, void 0, function* () {
            const { sessionToken } = req.body;
            const temp = typeof sessionToken === 'number'
                ? yield services_1.SessionService.getSession(sessionToken)
                : yield services_1.SessionService.verifySession(sessionToken);
            /* check if response is not successful */
            if (temp.response !== services_1.ServiceResponse.SUCCESS) {
                return (0, helpers_1.handleBadRes)(res, temp.response, temp.err);
            }
            const session = temp.result;
            /* check if owner matches person requesting */
            if (session.sessionCreatorId !== user.uid) {
                return res.status(Http_1.default.UNAUTHORIZED).json();
            }
            /* fetch chats */
            const chats = yield services_1.ChatService.getSessionChat(session.sessionId, user.uid);
            /* if fetching chats failed for some reason */
            if (chats.response !== services_1.ServiceResponse.SUCCESS) {
                return (0, helpers_1.handleBadRes)(res, chats.response, chats.err);
            }
            const attendeeRes = yield services_1.AttendeeService.getAttendees(session.sessionId);
            /* if fetching attendees failed for some reason */
            if (attendeeRes.response !== services_1.ServiceResponse.SUCCESS) {
                return (0, helpers_1.handleBadRes)(res, attendeeRes.response, attendeeRes.err);
            }
            return res.status(Http_1.default.OK).json({
                session: {
                    sessionNumber: session.sessionId,
                    sessionDuration: session.sessionDuration,
                    createdAt: session.createdAt
                },
                chat: chats.result,
                attendees: attendeeRes.result
            });
        }));
    });
}
exports.getSession = getSession;
/**
 * Used to retrieve user sessions.
 *
 * @param req HTTP request containing owner token in the header.
 * @param res HTTP response containing user session IDs.
 * @returns res with the appropriate code and the data
 */
function getUserSessions(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        return (0, helpers_1.verifyToken)(req, res, (user) => __awaiter(this, void 0, void 0, function* () {
            const sessions = yield services_1.SessionService.getUserSessions(user.uid);
            if (sessions.response !== services_1.ServiceResponse.SUCCESS) {
                return (0, helpers_1.handleBadRes)(res, sessions.response, sessions.err);
            }
            return res.status(Http_1.default.OK).json({
                sessionIds: sessions.result
            });
        }));
    });
}
exports.getUserSessions = getUserSessions;
/**
 * @param email to check.
 * @param token to check.
 *
 * @returns true if the token is valid and the email matches the token.
 */
function checkUserToken(email, token) {
    return __awaiter(this, void 0, void 0, function* () {
        const userRes = yield services_1.UserService.getUser(email);
        /* user does not exist */
        if (userRes.response !== services_1.ServiceResponse.SUCCESS || !userRes.result) {
            return false;
        }
        /* verify token */
        const container = { uid: null };
        yield services_1.UserService.verifyToken(token, container);
        return container.uid === userRes.result.email;
    });
}
/**
 * Called on a user socket.
 * Attaches all listeners to the socket.
 *
 * @param io socket.io server instance.
 * @param socket to attach listeners to.
 */
function attachListeners(io, socket) {
    onCreateListener(io, socket);
    onJoinListener(io, socket);
    onTerminateListener(io, socket);
    onLeaveListener(io, socket);
    onMuteListener(io, socket);
    onHideListener(io, socket);
    onMessageListener(io, socket);
    onSignalListener(io, socket);
}
exports.attachListeners = attachListeners;
/**
 * @param io socket.io server.
 * @param socket socket instance.
 */
function onSignalListener(io, socket) {
    socket.on(sockets_1.SocketEvent.SEND_SIGNAL, (argsList, callback) => __awaiter(this, void 0, void 0, function* () {
        const { target, sender, sessionToken } = argsList;
        /* check for missing data */
        if (!sender || !target || !sessionToken) {
            callback({
                response: Http_1.default.BAD,
                err: "missing sender, target, and/or session ID"
            });
            return;
        }
        /* get listener */
        const listener = sockets_1.RoomHandle.getListener(sessionToken);
        /* check listener */
        if (!listener) {
            callback({
                response: Http_1.default.NOT_FOUND,
                err: "session does not exist or has ended"
            });
            return;
        }
        /* try to join the session, calls callback in case of failure or success */
        listener.onSendSignal(socket, argsList, callback);
    }));
    socket.on(sockets_1.SocketEvent.RETURN_SIGNAL, (argsList, callback) => __awaiter(this, void 0, void 0, function* () {
        const { target, sender, sessionToken } = argsList;
        /* check for missing data */
        if (!sender || !target || !sessionToken) {
            callback({
                response: Http_1.default.BAD,
                err: "missing sender, target, and/or session ID"
            });
            return;
        }
        /* get listener */
        const listener = sockets_1.RoomHandle.getListener(sessionToken);
        /* check listener */
        if (!listener) {
            callback({
                response: Http_1.default.NOT_FOUND,
                err: "session does not exist or has ended"
            });
            return;
        }
        /* try to join the session, calls callback in case of failure or success */
        listener.onReturnSignal(socket, argsList, callback);
    }));
}
/**
 * @param io socket.io server.
 * @param socket socket instance.
 */
function onCreateListener(io, socket) {
    socket.on(sockets_1.SocketEvent.CREATE, (argsList, callback) => __awaiter(this, void 0, void 0, function* () {
        /* token is user token */
        const { token, uid, sessionPassword, isChat } = argsList;
        /* check for missing data */
        if (!token || !uid || !sessionPassword) {
            callback({
                response: Http_1.default.BAD,
                err: "missing token, uid, and/or session password"
            });
            return;
        }
        if (!(yield checkUserToken(uid, token))) {
            callback({
                response: Http_1.default.UNAUTHORIZED,
                err: "User token mismatch"
            });
            return;
        }
        const temp = yield services_1.SessionService.createSession(uid, sessionPassword, isChat);
        /* if session creation failed */
        if (temp.response !== services_1.ServiceResponse.SUCCESS || !temp.result) {
            callback((0, helpers_1.handleBadListener)(temp.response, temp.err));
            return;
        }
        /* generated session ID */
        const { sessionToken, sessionId } = temp.result;
        /* create room listener */
        sockets_1.RoomHandle.createListener(io, socket, token, uid, sessionPassword, sessionId, sessionToken, callback, isChat);
        /* inform user. Triggered iff not triggered in RoomHandle constructor */
        callback({ response: Http_1.default.OK, result: sessionToken });
    }));
}
/**
 * @param io socket.io server.
 * @param socket socket instance.
 */
function onLeaveListener(io, socket) {
    socket.on(sockets_1.SocketEvent.LEAVE, (argsList, callback) => __awaiter(this, void 0, void 0, function* () {
        const { uid, sessionToken } = argsList;
        /* check for missing data */
        if (!uid) {
            callback({
                response: Http_1.default.BAD,
                err: "missing uid"
            });
            return;
        }
        /* get listener */
        const listener = sockets_1.RoomHandle.getListener(sessionToken);
        /* check listener */
        if (!listener) {
            callback({
                response: Http_1.default.NOT_FOUND,
                err: "session does not exist or has ended"
            });
            return;
        }
        /* try to join the session, calls callback in case of failure or success */
        yield listener.onLeave(sessionToken, socket, argsList, callback);
    }));
}
/**
 * @param io socket.io server.
 * @param socket socket instance.
 */
function onMuteListener(io, socket) {
    socket.on(sockets_1.SocketEvent.MUTE, (argsList, callback) => __awaiter(this, void 0, void 0, function* () {
        const { uid, sessionToken } = argsList;
        /* check for missing data */
        if (!uid || !sessionToken) {
            callback({
                response: Http_1.default.BAD,
                err: "missing uid and/or session ID"
            });
            return;
        }
        /* get listener */
        const listener = sockets_1.RoomHandle.getListener(sessionToken);
        /* check listener */
        if (!listener) {
            callback({
                response: Http_1.default.NOT_FOUND,
                err: "session does not exist or has ended"
            });
            return;
        }
        /* try to join the session, calls callback in case of failure or success */
        listener.onMute(socket, argsList, callback);
    }));
}
/**
 * @param io socket.io server.
 * @param socket socket instance.
 */
function onHideListener(io, socket) {
    socket.on(sockets_1.SocketEvent.HIDE, (argsList, callback) => __awaiter(this, void 0, void 0, function* () {
        const { uid, sessionToken } = argsList;
        /* check for missing data */
        if (!uid || !sessionToken) {
            callback({
                response: Http_1.default.BAD,
                err: "missing uid and/or session ID"
            });
            return;
        }
        /* get listener */
        const listener = sockets_1.RoomHandle.getListener(sessionToken);
        /* check listener */
        if (!listener) {
            callback({
                response: Http_1.default.NOT_FOUND,
                err: "session does not exist or has ended"
            });
            return;
        }
        /* try to join the session, calls callback in case of failure or success */
        listener.onHide(socket, argsList, callback);
    }));
}
/**
 * @param io socket.io server.
 * @param socket socket instance.
 */
function onMessageListener(io, socket) {
    socket.on(sockets_1.SocketEvent.MSG, (argsList, callback) => __awaiter(this, void 0, void 0, function* () {
        const { message, sender, sessionToken, token } = argsList;
        /* check for missing data */
        if (!message || !sender || !sessionToken || !token) {
            callback({
                response: Http_1.default.BAD,
                err: "missing sender, message, token, and/or session ID"
            });
            return;
        }
        const isValidUser = yield checkUserToken(sender, token);
        /* check if token is valid */
        if (!isValidUser) {
            callback({
                response: Http_1.default.UNAUTHORIZED,
                err: "Invalid token"
            });
            return;
        }
        /* get listener */
        const listener = sockets_1.RoomHandle.getListener(sessionToken);
        /* check listener */
        if (!listener) {
            callback({
                response: Http_1.default.NOT_FOUND,
                err: "session does not exist or has ended"
            });
            return;
        }
        /* try to join the session, calls callback in case of failure or success */
        yield listener.onMessage(socket, argsList, callback);
    }));
}
/**
 * @param io socket.io server.
 * @param socket socket instance.
 */
function onJoinListener(io, socket) {
    socket.on(sockets_1.SocketEvent.JOIN, (argsList, callback) => __awaiter(this, void 0, void 0, function* () {
        const { token, uid, sessionToken, password } = argsList;
        /* check for missing data */
        if (!token || !uid || !password || !sessionToken) {
            callback({
                response: Http_1.default.BAD,
                err: "missing token, uid, session password, and/or session ID"
            });
            return;
        }
        if (!(yield checkUserToken(uid, token))) {
            callback({
                response: Http_1.default.UNAUTHORIZED,
                err: "User token mismatch"
            });
            return;
        }
        /* get listener */
        const listener = sockets_1.RoomHandle.getListener(sessionToken);
        /* check listener */
        if (!listener) {
            callback({
                response: Http_1.default.NOT_FOUND,
                err: "session does not exist or has ended"
            });
            return;
        }
        /* try to join the session, calls callback in case of failure or success */
        yield listener.onJoin(socket, argsList, callback);
    }));
}
/**
 * @param io socket.io server.
 * @param socket socket instance.
 */
function onTerminateListener(io, socket) {
    socket.on(sockets_1.SocketEvent.TERMINATE, (argsList, callback) => __awaiter(this, void 0, void 0, function* () {
        const { token, sessionToken, uid } = argsList;
        /* check for missing data */
        if (!token || !uid || !sessionToken) {
            callback({
                response: Http_1.default.BAD,
                err: "missing token, session ID, and/or creator email"
            });
            return;
        }
        if (!(yield checkUserToken(uid, token))) {
            callback({
                response: Http_1.default.UNAUTHORIZED,
                err: "User token mismatch"
            });
            return;
        }
        const temp = yield services_1.SessionService.verifySession(sessionToken);
        /* if session creation failed */
        if (temp.response !== services_1.ServiceResponse.SUCCESS) {
            callback((0, helpers_1.handleBadListener)(temp.response, temp.err));
            return;
        }
        /* get session */
        const session = temp.result;
        /* creator email of the session */
        const creatorEmail = yield session.getCreatorEmail();
        /* check owner */
        if (creatorEmail === undefined || creatorEmail !== uid) {
            callback({ response: Http_1.default.UNAUTHORIZED, err: "Invalid creator" });
            return;
        }
        session.endSession();
        const upRes = yield services_1.SessionService.updateSession(session);
        if (upRes.response !== services_1.ServiceResponse.SUCCESS) {
            callback({ response: Http_1.default.BAD, err: upRes.err });
            return;
        }
        /* inform user */
        callback({ response: Http_1.default.OK });
        /* terminate session */
        sockets_1.RoomHandle.terminateListener(socket, sessionToken);
    }));
}
