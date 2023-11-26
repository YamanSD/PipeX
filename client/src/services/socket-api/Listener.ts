import * as LocalStorage from '../storage/LocalStorage';
import * as Emitter from './Emitter';
import Event from "./Event";
import {ListenerCallback} from "./config";


/**
 * @param event to listen to.
 * @param callback called on event trigger.
 */
function listen(event: string, callback: ListenerCallback): void {
    const user = LocalStorage.getUser();

    /* check user */
    if (!user) {
        return;
    }

    Emitter.refreshSocket().on(event, callback);
}

/**
 * Activates message listener.
 *
 * @param callback takes message from another user.
 */
export function onMsg(callback: ListenerCallback<{
    message: string, sender: string,
    timestamp: number, directed: boolean,
    receiver?: string
}>): void {
    listen(Event.MSG, callback);
}

/**
 * Activates join listener.
 *
 * @param callback takes joined user ID.
 */
export function onJoin(callback: ListenerCallback<{uid: string, audio: boolean, video: boolean}>): void {
    listen(Event.JOIN, callback);
}

/**
 * Activates leave listener.
 *
 * @param callback takes ID of the user that left.
 */
export function onLeave(callback: ListenerCallback<{uid: string}>): void {
    listen(Event.LEAVE, callback);
}

/**
 * @param callback takes ID of the user and value, true indicates muted.
 */
export function onMute(callback: ListenerCallback<{uid: string, value: boolean}>): void {
    listen(Event.MUTE, callback);
}

/**
 * @param callback takes ID of the user and value, true indicates hidden camera.
 */
export function onHide(callback: ListenerCallback<{uid: string, value: boolean}>): void {
    listen(Event.HIDE, callback);
}

/**
 * Current room terminated.
 *
 * @param callback takes no values.
 */
export function onTermination(callback: ListenerCallback<undefined>): void {
    listen(Event.TERMINATE, callback);
}
