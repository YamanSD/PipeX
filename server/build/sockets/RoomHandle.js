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
const Event_1 = __importDefault(require("./Event"));
const services_1 = require("../services");
const controllers_1 = require("../controllers");
const helpers_1 = require("../controllers/helpers");
/**
 * Each instance represents a single session.
 * Provides callback function for listeners in upper layers.
 */
class RoomHandle {
    /**
     * @param id of the session, a number.
     * @returns room ID.
     */
    static translateSessionId(id) {
        return id.toString();
    }
    /**
     * @param uid user ID to get listener for.
     * @returns the user room ID.
     * @private
     */
    getUserRoom(uid) {
        return `${this.connectedUsers.get(uid)}${this.roomId}`;
    }
    /**
     * Adds user, then broadcasts their creator.
     *
     * @param socket creator socket.
     * @param uid to be added to the session.
     * @param token token of the joining user.
     * @param audio audio status of user on join.
     * @param video video status of the user on join.
     * @private
     */
    addUser(socket, uid, token, audio, video) {
        return __awaiter(this, void 0, void 0, function* () {
            this.connectedUsers.set(uid, token);
            /* join the new user's private room, and global room */
            socket.join([this.roomId, this.getUserRoom(uid)]);
            /* add user to attendee list */
            const res = yield services_1.AttendeeService.addAttendee(this.sessionId, uid);
            if (res.response !== services_1.ServiceResponse.SUCCESS) {
                return {
                    response: res.response,
                    err: res.err
                };
            }
            /* set user init media value */
            this.userMediaStatus[uid] = { audio: audio, video: video };
            /* broadcast to all users */
            this.io.to(this.roomId).emit(Event_1.default.JOIN, { uid: uid, audio: audio, video: video });
            /* success */
            return { response: res.response };
        });
    }
    /**
     * Removes user, then broadcasts their creator.
     *
     * @param socket creator socket.
     * @param uid to be removed from the session.
     * @private
     */
    removeUser(socket, uid) {
        this.connectedUsers.delete(uid);
        /* leave global room */
        socket.leave(this.roomId);
        /* remove media values */
        delete this.userMediaStatus[uid];
        /* broadcast to all users (except leaving) */
        this.io.to(this.roomId).emit(Event_1.default.LEAVE, { uid: uid });
    }
    /**
     * @param uid to be checked if currently connected.
     * @private
     */
    isConnected(uid) {
        return this.connectedUsers.has(uid);
    }
    /**
     * @param socket creator socket.
     * Terminates the session
     */
    terminate(socket) {
        /* inform users of the termination */
        this.io.in(this.roomId).emit(Event_1.default.TERMINATE);
    }
    /**
     * @param sessionToken to get listener for.
     * @returns the RoomHandle for the session.
     */
    static getListener(sessionToken) {
        return this.sessionListener.get(sessionToken);
    }
    /**
     * @param socket to remove listener for.
     * @param sessionToken to terminate.
     */
    static terminateListener(socket, sessionToken) {
        var _a;
        (_a = this.getListener(sessionToken)) === null || _a === void 0 ? void 0 : _a.terminate(socket);
        this.sessionListener.delete(sessionToken);
    }
    /**
     * @param io Socket.io server instance.
     * @param socket Socket.io socket instance through which the sockets passes.
     * @param userToken current token of the user.
     * @param creator ID (email) of the session creator.
     * @param password session password.
     * @param sessionId ID of the created session.
     * @param sessionToken token of the created session.
     * @param callback callback function for the parent.
     * @param isChat true for chat only sessions.
     * @constructor
     */
    static createListener(io, socket, userToken, creator, password, sessionId, sessionToken, callback, isChat) {
        this.sessionListener.set(sessionToken, new RoomHandle(io, socket, userToken, creator, password, sessionId, callback, isChat));
    }
    /**
     *
     * @param socket of the sending user.
     * @param argList signaling args.
     * @param callback callback response function.
     */
    onSendSignal(socket, argList, callback) {
        const { signal, sender, target, audio, video } = argList;
        if (!sender || !target) {
            callback({
                response: controllers_1.Http.BAD,
                err: "missing sender and/or target"
            });
            return;
        }
        else if (!this.isConnected(target)) {
            callback({
                response: controllers_1.Http.NOT_FOUND,
                err: "target not connected"
            });
            return;
        }
        else if (target === sender) {
            callback({ response: controllers_1.Http.OK });
            return;
        }
        this.io.in(this.getUserRoom(target)).emit(Event_1.default.SEND_SIGNAL, {
            signal,
            sender,
            target,
            audio,
            video
        });
        callback({ response: controllers_1.Http.OK });
    }
    /**
     *
     * @param socket of the sending user.
     * @param argList signaling args.
     * @param callback callback response function.
     */
    onReturnSignal(socket, argList, callback) {
        const { signal, sender, target, audio, video } = argList;
        if (!sender || !target) {
            callback({
                response: controllers_1.Http.BAD,
                err: "missing sender and/or target"
            });
            return;
        }
        else if (!this.isConnected(sender)) {
            callback({
                response: controllers_1.Http.NOT_FOUND,
                err: "caller not connected"
            });
            return;
        }
        else if (target === sender) {
            callback({ response: controllers_1.Http.OK });
            return;
        }
        this.io.in(this.getUserRoom(target)).emit(Event_1.default.RETURN_SIGNAL, {
            signal,
            sender,
            target,
            audio,
            video
        });
        callback({ response: controllers_1.Http.OK });
    }
    /**
     * Callback function on join event.
     *
     * @param socket new user socket.
     * @param argList arguments provided by user.
     * @param callback responds to user.
     */
    onJoin(socket, argList, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const { uid, token, password, sessionToken, audio, video } = argList;
            /* check for missing data */
            if (!uid || !token || !password || !sessionToken) {
                callback({
                    response: controllers_1.Http.BAD,
                    err: "missing token, uid, session password, and/or session ID"
                });
                return;
            }
            /* get session */
            const sessionRes = yield services_1.SessionService.verifySession(sessionToken);
            /* check session response */
            if (sessionRes.response !== services_1.ServiceResponse.SUCCESS || !sessionRes.result) {
                callback((0, helpers_1.handleBadListener)(sessionRes.response, sessionRes.err));
                return;
            }
            /* session instance */
            const session = sessionRes.result;
            /* session has ended, user cannot join */
            if (session.hasEnded) {
                callback({
                    response: controllers_1.Http.GONE,
                    err: "Session has ended"
                });
                return;
            }
            /* extract session ID */
            const sessionId = session.sessionId;
            if (password !== this.password || sessionId !== this.sessionId) {
                callback({
                    response: controllers_1.Http.UNAUTHORIZED,
                    err: "Invalid password and/or session ID"
                });
                return;
            }
            const res = yield this.addUser(socket, uid, token, audio !== null && audio !== void 0 ? audio : false, video !== null && video !== void 0 ? video : false);
            if (res.response !== services_1.ServiceResponse.SUCCESS) {
                callback((0, helpers_1.handleBadListener)(res.response, res.err));
                return;
            }
            /* inform user that join is successful, and return list of users */
            callback({ result: { users: this.userMediaStatus, isChat: this.isChat, creator: this.creator }, response: controllers_1.Http.OK });
        });
    }
    /**
     * @returns true if the session is empty, or has 1 user.
     */
    get isLast() {
        return this.connectedUsers.size === 0;
    }
    /**
     * Callback function on leave event.
     *
     * @param sessionToken to leave.
     * @param socket new user socket.
     * @param argList arguments provided by user.
     * @param callback responds to user.
     */
    onLeave(sessionToken, socket, argList, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const { uid } = argList;
            /* check for missing data */
            if (!uid) {
                callback({
                    response: controllers_1.Http.BAD,
                    err: "Missing uid"
                });
                return;
            }
            /* if last user, terminate session */
            if (this.isLast) {
                const temp = yield services_1.SessionService.verifySession(sessionToken);
                /* if session creation failed */
                if (temp.response !== services_1.ServiceResponse.SUCCESS || !temp.result) {
                    callback((0, helpers_1.handleBadListener)(temp.response, temp.err));
                    return;
                }
                /* get session */
                const session = temp.result;
                session.endSession();
                const upRes = yield services_1.SessionService.updateSession(session);
                if (upRes.response !== services_1.ServiceResponse.SUCCESS) {
                    callback({ response: controllers_1.Http.BAD, err: upRes.err });
                    return;
                }
                /* send before closing socket */
                callback({ response: controllers_1.Http.OK });
                /* terminate session */
                RoomHandle.terminateListener(socket, sessionToken);
            }
            else {
                /* remove user */
                this.removeUser(socket, uid);
            }
            callback({ response: controllers_1.Http.OK });
        });
    }
    /**
     * Callback function on message event.
     *
     * @param socket new user socket.
     * @param argList arguments provided by user.
     * @param callback responds to user.
     */
    onMessage(socket, argList, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const { message, sender, receiver, token } = argList;
            /* check for missing data */
            if (!message || !sender || !token) {
                callback({
                    response: controllers_1.Http.BAD,
                    err: "Missing message, token, and/or sender"
                });
                return;
            }
            const res = yield this.sendMsg(message, sender, receiver);
            if (res.response !== services_1.ServiceResponse.SUCCESS) {
                callback((0, helpers_1.handleBadListener)(res.response, res.err));
                return;
            }
            /* inform user that join is successful */
            callback({ response: controllers_1.Http.OK });
        });
    }
    /**
     * Callback function on mute event.
     *
     * @param socket new user socket.
     * @param argList arguments provided by user.
     * @param callback responds to user.
     */
    onMute(socket, argList, callback) {
        const { uid, value } = argList;
        /* check for missing data */
        if (!uid) {
            callback({
                response: controllers_1.Http.BAD,
                err: "Missing uid"
            });
            return;
        }
        /* set user audio value */
        this.userMediaStatus[uid].audio = value;
        this.io.to(this.roomId).emit(Event_1.default.MUTE, { uid: uid, value: value });
        callback({ response: controllers_1.Http.OK });
    }
    /**
     * Callback function on hide event.
     *
     * @param socket new user socket.
     * @param argList arguments provided by user.
     * @param callback responds to user.
     */
    onHide(socket, argList, callback) {
        const { uid, value } = argList;
        /* check for missing data */
        if (!uid) {
            callback({
                response: controllers_1.Http.BAD,
                err: "Missing uid"
            });
            return;
        }
        /* set user video value */
        this.userMediaStatus[uid].video = value;
        this.io.to(this.roomId).emit(Event_1.default.HIDE, { uid: uid, value: value });
        callback({ response: controllers_1.Http.OK });
    }
    /**
     * @param io Socket.io server instance.
     * @param socket Socket.io socket instance through which the sockets passes.
     * @param userToken current token of the user.
     * @param creator ID (email) of the creator of the session.
     * @param password session password.
     * @param sessionId ID of the created session.
     * @param callback callback function for the parent.
     * @param isChat true for chat only sessions.
     * @constructor
     */
    constructor(io, socket, userToken, creator, password, sessionId, callback, isChat) {
        /* initialize data members */
        this.io = io;
        this.creator = creator;
        this.password = password;
        this.sessionId = sessionId;
        this.roomId = RoomHandle.translateSessionId(this.sessionId);
        this.connectedUsers = new Map();
        this.isChat = isChat;
        this.userMediaStatus = {};
        /* add creator */
        this.addUser(socket, creator, userToken, false, false).then(r => {
            if (r.response !== services_1.ServiceResponse.SUCCESS) {
                callback((0, helpers_1.handleBadListener)(r.response, r.err));
                return;
            }
        });
    }
    /**
     * @param sender ID of the sending user.
     * @param message to be sent.
     * @param receiver ID of the receiving user. Sends to everyone if undefined.
     */
    sendMsg(message, sender, receiver) {
        return __awaiter(this, void 0, void 0, function* () {
            /*
             * Check if receiver or sender is not connected.
             */
            if (!this.isConnected(sender) || !(receiver === undefined || this.isConnected(receiver))) {
                return {
                    response: services_1.ServiceResponse.INVALID_IN,
                    err: "Sender or receiver is not connected"
                };
            }
            /* try to add message to database */
            const res = yield services_1.ChatService.addChat(this.sessionId, message, sender, receiver);
            /* if successful */
            if (res.response === services_1.ServiceResponse.SUCCESS) {
                /* emit the message */
                if (receiver === undefined) {
                    /* emit the message */
                    this.io.in(this.roomId).emit(Event_1.default.MSG, {
                        message: message,
                        sender: sender,
                        directed: false,
                        timestamp: (new Date()).getTime()
                    });
                }
                else {
                    /* emit the message to sender and receiver */
                    this.io.in(this.getUserRoom(receiver)).in(this.getUserRoom(sender)).emit(Event_1.default.MSG, {
                        message: message,
                        sender: sender,
                        receiver: receiver,
                        directed: true,
                        timestamp: (new Date()).getTime()
                    });
                }
                /* success */
                return { response: res.response };
            }
            else {
                return {
                    response: res.response,
                    err: res.err
                };
            }
        });
    }
}
/**
 * Maps session token to its room listener.
 */
RoomHandle.sessionListener = new Map();
exports.default = RoomHandle;
;
