import Event from "./Event";
import {AttendeeService, ChatService, ServiceResponse, SessionService} from '../services';
import {Server, Socket} from 'socket.io';
import {Http} from '../controllers';
import {handleBadListener} from "../controllers/helpers";
import {Session} from "../model";


/**
 * Type alias for the type of arguments received on user leave.
 *
 * >- uid: ID of the user that left.
 * >- sessionToken: token of the session the user left.
 */
export type LeaveArgs = {
    uid: string,
    sessionToken: string
};

/**
 * Type alias for the type of arguments received on user join.
 *
 * >- uid: ID of the user that joined.
 * >- token: current token of the user.
 * >- password: session password.
 * >- sessionToken: sessionToken to join.
 * >- audio?: initial audio preferences.
 * >- video?: initial video preferences.
 */
export type JoinArgs = {
    uid: string,
    token: string,
    password: string,
    sessionToken: string,
    audio?: boolean,
    video?: boolean,
}

/**
 * Type alias for the type of arguments required to send a
 * message to a specific recipient.
 *
 * >- sender: ID of the sender.
 * >- token: sender token.
 * >- receiver: ID of the receiver.
 * >- message: message to be sent.
 * >- sessionToken: to send the message to.
 */
export type MessageArgs = {
    sender: string,
    token: string,
    message: string,
    receiver?: string,
    sessionToken: string
};

/**
 * Type alias for the type of arguments received on user ready.
 *
 * >- uid: ID of the user that is ready.
 * >- token: current token of the user.
 * >- sessionToken: sessionToken joined.
 */
export type ReadyArgs = {
    uid: string,
    token: string,
    sessionToken: string,
}

/**
 * Type alias for the mute mic listener.
 *
 * >- uid: User ID that changed their state.
 * >- value: true, user mic set to mute, false user mic open.
 */
export type PrefArgs = {
    uid: string,
    value: {
        audio: boolean,
        video: boolean,
        screen: boolean
    },
    sessionToken: string
};

/**
 * Type alias for callback functions used by the listeners.
 */
export type Callback<T = any> = (res: {
    response: Http,
    err?: unknown,
    result?: T
}) => any;

/**
 * Each instance represents a single session.
 * Provides callback function for listeners in upper layers.
 */
export default class RoomHandle {
    /**
     * Maps session token to its room listener.
     */
    public static sessionListener: Map<string, RoomHandle> = new Map<string, RoomHandle>();

    /**
     * Map of connected user IDs to their connection tokens, with roomID appended to the end.
     * Keeps track of currently connected users.
     *
     * @private
     */
    private readonly connectedUsers: Map<string, string>;

    /**
     * Maps user IDs to their media status.
     *
     * @private
     */
    private readonly userMediaStatus: {[uid: string]: {audio: boolean, video: boolean, screen: boolean}};

    /**
     * Reference to the socket.io server instance.
     * Used for performing the sockets.
     *
     * @private
     */
    private readonly io: Server;

    /**
     * ID of the session creator.
     *
     * @private
     */
    private readonly creator: string;

    /**
     * ID of the session this instance is responsible for
     * performing the sockets for.
     *
     * @private
     */
    private readonly sessionId: number;

    /**
     * True indicates chat only session.
     *
     * @private
     */
    private readonly isChat: boolean;

    /**
     * ID of the socket.io chat room.
     *
     * @private
     */
    private readonly roomId: string;

    /**
     * Session password.
     *
     * @private
     */
    private readonly password: string;

    /**
     * @param id of the session, a number.
     * @returns room ID.
     */
    public static translateSessionId(id: number): string {
        return id.toString();
    }

    /**
     * @param uid user ID to get listener for.
     * @returns the user room ID.
     * @private
     */
    private getUserRoom(uid: string): string {
        return `${this.connectedUsers.get(uid) as string}${this.roomId}`;
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
    private async addUser(socket: Socket, uid: string, token: string,
                          audio: boolean, video: boolean) {
        this.connectedUsers.set(uid, token);

        /* add user to attendee list */
        const res = await AttendeeService.addAttendee(this.sessionId, uid);

        if (res.response !== ServiceResponse.SUCCESS) {
            return {
                response: res.response,
                err: res.err
            };
        }

        /* join the new user's private room, and global room */
        socket.join([this.roomId, this.getUserRoom(uid)]);

        /* set user init media value */
        this.userMediaStatus[uid] = {audio: audio, video: video, screen: false};

        /* on disconnect inform others of leave */
        socket.on(Event.DISCONNECT, () => {
            this.io.in(this.roomId).emit(Event.LEAVE, {
                uid: uid
            });
        });

        /* broadcast to all users */
        this.io.to(this.roomId).emit(Event.JOIN, {
            uid: uid,
            peerId: this.toHex(uid),
            preferences: {...this.userMediaStatus[uid]}
        });

        /* success */
        return { response: res.response };
    }

    /**
     * Removes user, then broadcasts their creator.
     *
     * @param socket creator socket.
     * @param uid to be removed from the session.
     * @private
     */
    private removeUser(socket: Socket, uid: string): void {
        this.connectedUsers.delete(uid);

        /* leave global room */
        socket.leave(this.roomId);

        /* remove media values */
        delete this.userMediaStatus[uid];

        /* broadcast to all users (except leaving) */
        this.io.to(this.roomId).emit(Event.LEAVE, {uid: uid});
    }

    /**
     * @param uid to be checked if currently connected.
     * @private
     */
    private isConnected(uid: string): boolean {
        return this.connectedUsers.has(uid);
    }

    /**
     * @param socket creator socket.
     * Terminates the session
     */
    public terminate(socket: Socket): void {
        /* inform users of the termination */
        this.io.in(this.roomId).emit(Event.TERMINATE);
    }

    /**
     * @param sessionToken to get listener for.
     * @returns the RoomHandle for the session.
     */
    public static getListener(sessionToken: string): RoomHandle | undefined {
        return this.sessionListener.get(sessionToken);
    }

    /**
     * @param socket to remove listener for.
     * @param sessionToken to terminate.
     */
    public static terminateListener(socket: Socket, sessionToken: string): void {
        this.getListener(sessionToken)?.terminate(socket);
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
    public static createListener(
          io: Server,
          socket: Socket,
          userToken: string,
          creator: string,
          password: string,
          sessionId: number,
          sessionToken: string,
          callback: Callback,
          isChat: boolean) {
        this.sessionListener.set(sessionToken, new RoomHandle(
            io, socket, userToken,
            creator, password, sessionId,
            callback, isChat
        ));
    }

    /**
     * @param v to be converted to hex.
     * @returns the hex encoding of v.
     * @private
     */
    private toHex(v: string): string {
        return v.split("")
            .map(c => c.charCodeAt(0).toString(16).padStart(2, "0"))
            .join("");
    }

    /**
     * Callback function on join event.
     *
     * @param socket new user socket.
     * @param argList arguments provided by user.
     * @param callback responds to user.
     */
    public async onJoin(socket: Socket, argList: JoinArgs, callback: Callback) {
        const {uid, token, password, sessionToken, audio, video} = argList;

        /* check for missing data */
        if (!uid || !token || !password || !sessionToken) {
            callback({
                response: Http.BAD,
                err: "missing token, uid, session password, and/or session ID"
            });
            return;
        }

        /* get session */
        const sessionRes = await SessionService.verifySession(sessionToken);

        /* check session response */
        if (sessionRes.response !== ServiceResponse.SUCCESS || !sessionRes.result) {
            callback(handleBadListener(sessionRes.response, sessionRes.err));
            return;
        }

        /* session instance */
        const session = sessionRes.result;

        /* session has ended, user cannot join */
        if (session.hasEnded) {
            callback({
                response: Http.GONE,
                err: "Session has ended"
            });
            return;
        }

        /* extract session ID */
        const sessionId = session.sessionId;

        if (password !== this.password || sessionId !== this.sessionId) {
            callback({
                response: Http.UNAUTHORIZED,
                err: "Invalid password and/or session ID"
            });
            return;
        }

        const res = await this.addUser(
            socket,
            uid,
            token,
            audio ?? false,
            video ?? false
        );

        if (res.response !== ServiceResponse.SUCCESS) {
            callback(handleBadListener(res.response, res.err));
            return;
        }

        const usersInfo = Object.keys(this.userMediaStatus).map(uid => {
            return {
                peerId: this.toHex(uid),
                ...this.userMediaStatus[uid]
            }
        });

        /* inform user that join is successful, and return list of users */
        callback({ result: {
                users: usersInfo,
                isChat: this.isChat,
                creator: this.creator
            },
            response: Http.OK });
    }

    /**
     * @returns true if the session is empty.
     */
    public get isEmpty(): boolean {
        return this.connectedUsers.size === 0;
    }

    /**
     * @returns the number of currently connected users.
     */
    public get userCount(): number {
        return this.connectedUsers.size;
    }

    /**
     * Callback function on leave event.
     *
     * @param socket new user socket.
     * @param argList arguments provided by user.
     * @param callback responds to user.
     */
    public async onReady(socket: Socket, argList: ReadyArgs, callback: Callback) {
        const {uid} = argList;

        /* check for missing data */
        if (!uid) {
            callback({
                response: Http.BAD,
                err: "Missing uid"
            });
            return;
        } else if (!this.isConnected(uid)) {
            callback({
                response: Http.UNAUTHORIZED,
                err: "Not in session"
            });
            return;
        }

        /* broadcast readiness to all */
        this.io.in(this.roomId).emit(Event.READY, {
            uid: uid
        });

        callback({ response: Http.OK });
    }

    /**
     * Callback function on leave event.
     *
     * @param sessionToken to leave.
     * @param socket new user socket.
     * @param argList arguments provided by user.
     * @param callback responds to user.
     */
    public async onLeave(sessionToken: string, socket: Socket,
                   argList: LeaveArgs, callback: Callback) {
        const {uid} = argList;

        /* check for missing data */
        if (!uid) {
            callback({
                response: Http.BAD,
                err: "Missing uid"
            });
            return;
        }

        /* if last user, terminate session */
        if (this.isEmpty) {
            const temp = await SessionService.verifySession(sessionToken);

            /* if session creation failed */
            if (temp.response !== ServiceResponse.SUCCESS || !temp.result) {
                callback(handleBadListener(temp.response, temp.err));
                return;
            }

            /* get session */
            const session = temp.result as Session;

            session.endSession();
            const upRes = await SessionService.updateSession(session);

            if (upRes.response !== ServiceResponse.SUCCESS) {
                callback({ response: Http.BAD, err: upRes.err });
                return;
            }

            /* send before closing socket */
            callback({ response: Http.OK });

            /* terminate session */
            RoomHandle.terminateListener(socket, sessionToken);
        } else {
            /* remove user */
            this.removeUser(socket, uid);
        }

        callback({ response: Http.OK });
    }

    /**
     * Callback function on message event.
     *
     * @param socket new user socket.
     * @param argList arguments provided by user.
     * @param callback responds to user.
     */
    public async onMessage(socket: Socket, argList: MessageArgs, callback: Callback) {
        const {message, sender, receiver, token} = argList;

        /* check for missing data */
        if (!message || !sender || !token) {
            callback({
                response: Http.BAD,
                err: "Missing message, token, and/or sender"
            });
            return;
        }

        const res = await this.sendMsg(message, sender, receiver);

        if (res.response !== ServiceResponse.SUCCESS) {
            callback(handleBadListener(res.response, res.err));
            return;
        }

        /* inform user that join is successful */
        callback({ response: Http.OK });
    }

    /**
     * Callback function on media preference event.
     *
     * @param socket new user socket.
     * @param argList arguments provided by user.
     * @param callback responds to user.
     */
    public onPreference(socket: Socket, argList: PrefArgs, callback: Callback) {
        const {uid, value} = argList;

        /* check for missing data */
        if (!uid) {
            callback({
                response: Http.BAD,
                err: "Missing uid"
            });
            return;
        }

        /* set user pref value */
        this.userMediaStatus[uid] = value;

        this.io.to(this.roomId).emit(Event.PREFERENCE, {
                uid: uid,
                value: value
        });

        callback({ response: Http.OK });
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
    protected constructor(io: Server,
                       socket: Socket,
                       userToken: string,
                       creator: string,
                       password: string,
                       sessionId: number,
                       callback: Callback,
                       isChat: boolean) {
        /* initialize data members */
        this.io = io;
        this.creator = creator;
        this.password = password;
        this.sessionId = sessionId;
        this.roomId = RoomHandle.translateSessionId(this.sessionId);
        this.connectedUsers = new Map<string, string>();
        this.isChat = isChat;
        this.userMediaStatus = {};

        /* add creator */
        this.addUser(socket, creator, userToken, false, false).then(r => {
            if (r.response !== ServiceResponse.SUCCESS) {
                callback(handleBadListener(r.response, r.err));
                return;
            }
        });
    }

    /**
     * @param sender ID of the sending user.
     * @param message to be sent.
     * @param receiver ID of the receiving user. Sends to everyone if undefined.
     */
    public async sendMsg(message: string, sender: string, receiver: string | undefined) {
        /*
         * Check if receiver or sender is not connected.
         */
        if (!this.isConnected(sender) || !(receiver === undefined || this.isConnected(receiver))) {
            return {
                response: ServiceResponse.INVALID_IN,
                err: "Sender or receiver is not connected"
            };
        }

        /* try to add message to database */
        const res = await ChatService.addChat(
            this.sessionId,
            message,
            sender,
            receiver
        );

        /* if successful */
        if (res.response === ServiceResponse.SUCCESS) {
            /* emit the message */
            if (receiver === undefined) {
                /* emit the message */
                this.io.in(
                    this.roomId
                ).emit(Event.MSG, {
                    message: message,
                    sender: sender,
                    directed: false,
                    timestamp: (new Date()).getTime()
                });
            } else {
                /* emit the message to sender and receiver */
                this.io.in(
                    this.getUserRoom(receiver)
                ).in(
                    this.getUserRoom(sender)
                ).emit(Event.MSG, {
                    message: message,
                    sender: sender,
                    receiver: receiver,
                    directed: true,
                    timestamp: (new Date()).getTime()
                });
            }

            /* success */
            return { response: res.response };
        } else {
            return {
                response: res.response,
                err: res.err
            };
        }
    }
};
