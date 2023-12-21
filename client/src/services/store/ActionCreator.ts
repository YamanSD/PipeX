import ActionType from "./ActionType";
import {store} from "../../index";
import {KnownPeers, UserPreference} from "../../components";

/* type alias for the state type */
export type RootState = ReturnType<typeof store.getState>

/*
 * Type alias for the state type of the UserReducer.
 */
export type StateType = {
    currentUser: UserType | null,
    participants: {[uid: string]: UserType} | null,
};

/*
 * Type alias for the state type of the PeersReducer.
 */
export type PeerStateType = {
    peers?: KnownPeers
};

/* type alias for the UserReducer action type */
export type ActionInputType<T = any> = {type: ActionType, payload?: T};

/*
 * Default user state.
 */
export const defaultUserState: StateType = {
    participants: {},
    currentUser: null
};

/*
 * Default peer state.
 */
export const defaultPeerState: PeerStateType = {
    peers: undefined
};

/* Type alias for the user type */
export type UserType = {
    uid: string,
    preferences: {
        audio: boolean,
        video: boolean,
        screen: boolean
    },
    stream?: MediaStream,
    isCurrent: boolean
};

/**
 * @param user
 */
export const setUser = (user: UserType) => {
    return {
        type: ActionType.SetUser,
        payload: {
            currentUser: user,
        },
    };
};

/**
 * @param peers
 */
export const setKnownPeers = (peers: KnownPeers) => {
    return {
        type: ActionType.SetPeers,
        payload: {
            peers: peers
        }
    };
}

/**
 * @param user
 */
export const addParticipant = (user: UserType) => {
    return {
        type: ActionType.AddParticipant,
        payload: {
            newUser: user,
        },
    };
};

/**
 * @param newPrefs
 */
export const updateUser = (newPrefs: UserPreference) => {
    return {
        type: ActionType.UpdateUser,
        payload: {
            newPrefs: newPrefs,
        },
    };
};

/**
 * @param user
 */
export const updateParticipant = (user: UserType) => {
    return {
        type: ActionType.UpdateParticipant,
        payload: {
            newUser: user,
        },
    };
};

/**
 * @param uid
 */
export const removeParticipant = (uid: string) => {
    return {
        type: ActionType.RemoveParticipant,
        payload: {
            id: uid,
        },
    };
};