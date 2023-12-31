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
 * @param event to drop listening to.
 */
function off(event: string): void {
    const user = LocalStorage.getUser();

    /* check user */
    if (!user) {
        return;
    }

    Emitter.refreshSocket().off(event);
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
export function onJoin(callback: ListenerCallback<{peerId: string, uid: string, preferences: {audio: boolean, video: boolean, screen: boolean}}>): void {
    listen(Event.JOIN, callback);
}

/**
 * Activates leave listener.
 *
 * @param callback takes ID of the user that left.
 */
export function onLeave(callback: ListenerCallback<{uid: string, peerId: string}>): void {
    listen(Event.LEAVE, callback);
}

/**
 * @param callback takes ID of the user and value.
 */
export function onPreference(callback: ListenerCallback<{
    uid: string,
    peerId: string,
    value: {
        audio: boolean,
        video: boolean,
        screen: boolean
    }}>
): void {
    listen(Event.PREFERENCE, callback);
}

/**
 * @param callback takes ID of the ready user.
 */
export function onReady(callback: ListenerCallback<{peerId: string}>
): void {
    listen(Event.READY, callback);
}

/**
 * Current room terminated.
 *
 * @param callback takes no values.
 */
export function onTermination(callback: ListenerCallback<undefined>): void {
    listen(Event.TERMINATE, callback);
}

/**
 * @param callback
 */
export function onTranscript(callback: ListenerCallback<{sender: string, message: string}>): void {
   listen(Event.TRANSCRIPT, callback);
}

/**
 * Stops listening to transcripts.
 */
export function offTranscript() {
    off(Event.TRANSCRIPT);
}
