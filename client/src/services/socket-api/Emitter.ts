import {io, Socket} from "socket.io-client";
import Event from "./Event";
import * as LocalStorage from '../storage/LocalStorage';
import config, {EmitterCallback} from "./config";
import Http from "../Http";
import Peer from "peerjs";
import {toast} from "react-toastify";
import {UserPreference} from "../../components";


/* user socket instance used to communicate with the server */
let socket: Socket | undefined = undefined;

/* PeerJS connection instance */
let myPeer: Peer | undefined = undefined;

/**
 * @param user to check.
 * @param callback callback response function.
 *
 * @returns true if there is no logged in user, or the user is not in a session.
 */
const checkUserInSession = (user: LocalStorage.User | null, callback: EmitterCallback) => {
    /* check if there is a user or user is not in a room */
    if (!user) {
        callback({
            response: Http.UNAUTHORIZED,
            err: "Not logged in"
        });
        return true;
    } else if (!user.currentRoom) {
        callback({
            response: Http.BAD,
            err: "Not in a room"
        });
        return true;
    }

    return false;
}

/**
 * @returns a new socket instance to the server.
 */
function connect(): Socket {
    const result = io(config.server, {
        transports : ['websocket'],
        query: {
            token: LocalStorage.getUser()?.token
        }
    });

    /* upon connecting to the server, update the local storage */
    result.on(Event.CONNECTION, () => {
        const user = LocalStorage.getUser();

        if (user && !user.isConnected) {
            user.isConnected = true;
            LocalStorage.setUser(user);
        }
    });

    /* upon disconnecting from the server, update the local storage */
    result.on(Event.DISCONNECT, () => {
        const user = LocalStorage.getUser();

        if (user && user.isConnected) {
            user.isConnected = false;
            LocalStorage.setUser(user);
        }
    });

    return result;
}

/**
 * @returns a new peer object.
 */
function connectPeer(): Peer {
    const user = LocalStorage.getUser();
    let id: string;

    if (!user) {
        id = '';
    } else {
        id = user.uid.split("")
            .map(c => c.charCodeAt(0).toString(16).padStart(2, "0"))
            .join("");
    }

    const result = new Peer(
        id,
        {
            host: `${config.peerServer}`,
            port: config.peerPort,
            secure: true
        }
    );

    result.on('error', (err) => {
        toast.error(`Error in peer connection! ${err}`, {
            autoClose: false
        });
    });

    return result;
}

/**
 * Creates a peer object if one does not exist and returns it.
 */
export function refreshPeer(): Peer {
    /* if myPeer is defined */
    if (myPeer) {
        return myPeer;
    }

    /* try to connect */
    myPeer = connectPeer();

    return myPeer;
}

/**
 * Resets the user socket instance.
 */
export function refreshSocket(): Socket {
    /* if socket is defined */
    if (socket) {
        return socket;
    }

    /* try to connect */
    socket = connect();

    return socket;
}

/**
 * @param event type of event to be emitted to the server.
 * @param callback function for callback emits.
 * @param args arguments to the event.
 */
function emit(event: Event,
              callback: null | EmitterCallback,
              args: any): void {
    if (callback) {
        refreshSocket().emit(event, args, callback);
    } else {
        refreshSocket().emit(event, args);
    }
}

/**
 * Type alias for the response of the join function.
 *
 * Users object keys are the peerId in P2P conferences, and
 * uid in WebChats.
 */
type JoinResponse = {
    users: {[peerIdOrUid: string]: {
        preferences: UserPreference,
        peerId: string,
        uid: string
    }},
    isChat: boolean,
    creator: string,
}

/**
 * @param sessionId to join.
 * @param password of the session.
 * @param callback callback response function.
 */
export function joinSession(sessionId: string,
                            password: string,
                            callback: EmitterCallback<JoinResponse>): void {
    const user = LocalStorage.getUser();

    if (!user || user.currentRoom && user.currentRoom !== sessionId) {
        callback({
            response: Http.BAD,
            err: "Already in a room"
        });
        return;
    }

    user.currentRoom = sessionId;
    LocalStorage.setUser(user);

    emit(Event.JOIN, callback, {
        uid: user.uid,
        token: user.token,
        password: password,
        sessionToken: sessionId
    });
}

/**
 * @param callback callback response function.
 */
export function leaveSession(callback: EmitterCallback): void {
    const user = LocalStorage.getUser();

    if (checkUserInSession(user, callback) || !user) {
        return;
    }

    emit(Event.LEAVE, callback, {
        uid: user.uid,
        sessionToken: user.currentRoom
    });
}

/**
 * Automatically changes local user current room.
 *
 * @param password session password.
 * @param isChat boolean true for WebChats.
 * @param callback callback response function.
 */
export function createSession(password: string,
                              isChat: boolean,
                              callback: EmitterCallback<string>): void {
    const user = LocalStorage.getUser();

    /* check if there is a user or user is already in a room */
    if (!user) {
        callback({
            response: Http.UNAUTHORIZED,
            err: "Not logged in"
        });
        return;
    } else if (user.currentRoom) {
        callback({
            response: Http.BAD,
            err: "Currently in a room"
        });
        return;
    }

    const callbackWrapper: EmitterCallback = (args) => {
        if (args.response === Http.OK) {
            user.currentRoom = `${args.result}`;
            LocalStorage.setUser(user);
        }

        callback(args);
    };

    emit(Event.CREATE, callbackWrapper, {
        uid: user.uid,
        token: user.token,
        sessionPassword: password,
        isChat: isChat
    });
}

/**
 * @param password session password.
 * @param callback callback response function.
 */
export function terminateSession(password: string,
                                 callback: EmitterCallback): void {
    const user = LocalStorage.getUser();

    if (checkUserInSession(user, callback) || !user) {
        return;
    }

    const callbackWrapper: EmitterCallback = (args) => {
        if (args.response === Http.OK) {
            LocalStorage.setUser(user);
        }

        callback(args);
    };

    emit(Event.TERMINATE, callbackWrapper, {
        uid: user.uid,
        token: user.token,
        sessionToken: user.currentRoom
    });
}

/**
 * @param value new media value.
 * @param callback callback response function.
 */
export function updatePreference(value: {audio: boolean, video: boolean, screen: boolean},
                                 callback: EmitterCallback): void {
    const user = LocalStorage.getUser();

    if (checkUserInSession(user, callback) || !user) {
        return;
    }

    emit(
        Event.PREFERENCE,
        callback,
        {
            uid: user.uid,
            value: value,
            sessionToken: user.currentRoom
        }
    );
}

/**
 * @param callback callback response function.
 */
export function ready(callback: EmitterCallback): void {
    const user = LocalStorage.getUser();

    if (checkUserInSession(user, callback) || !user) {
        return;
    }

    emit(
        Event.READY,
        callback,
        {
            uid: user.uid,
            token: user.token,
            sessionToken: user.currentRoom
        }
    );
}

/**
 * @param msg to be sent
 * @param recipient ID of the recipient user.
 * @param callback callback response function.
 */
export function sendMsg(msg: string,
                        recipient: string | undefined,
                        callback: EmitterCallback): void {
    const user = LocalStorage.getUser();

    if (checkUserInSession(user, callback) || !user) {
        return;
    }

    emit(
        Event.MSG,
        callback,
        {
            sender: user.uid,
            token: user.token,
            message: msg,
            receiver: recipient,
            sessionToken: user.currentRoom
        }
    );
}


