import React from "react";
import {MediaConnection} from "peerjs";

/**
 * Generic component type.
 */
export type Component<T = any> = (props: T) => JSX.Element;

/**
 * Generic type for react state setters.
 */
export type StateSetter<T = any> = React.Dispatch<React.SetStateAction<T>>;

/**
 * Generic object type.
 */
export type Generic<T = any> = {[_: string]: T};

/**
 * Type alias for user preferences.
 */
export type UserPreference = {
    audio: boolean,
    video: boolean,
    screen: boolean
};

/**
 * Type alias for the type of input given
 * to the update preferences function.
 */
export type UpdatePreferences = {
    audio?: boolean,
    video?: boolean,
    screen?: boolean
};

/**
 * Type alias for the stored info about peers.
 */
export type UserPeerInfo = {
    uid: string,
    preferences: UserPreference,
    peerId: string
};

/**
 * Type alias for the peers' container.
 */
export type KnownPeers = {[uid: string]: {
    call?: MediaConnection,
    stream?: MediaStream,
    data: UserPeerInfo
}};
