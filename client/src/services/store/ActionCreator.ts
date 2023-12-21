import UserAction from "./ActionType";
import {store} from "../../index";
import {UserPreference} from "../../components";

/* type alias for the state type */
export type RootState = ReturnType<typeof store.getState>

/*
 * Type alias for the state type of the UserReducer.
 */
export type StateType = {
    currentUser: UserType | null,
    participants: {[uid: string]: UserType} | null,
};

/* type alias for the UserReducer action type */
export type ActionInputType = {type: UserAction, payload?: any};

/*
 * Default user state.
 */
export const defaultUserState: StateType = {
    participants: {},
    currentUser: null
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
        type: UserAction.SetUser,
        payload: {
            currentUser: user,
        },
    };
};

/**
 * @param user
 */
export const addParticipant = (user: UserType) => {
    return {
        type: UserAction.AddParticipant,
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
        type: UserAction.UpdateUser,
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
        type: UserAction.UpdateParticipant,
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
        type: UserAction.RemoveParticipant,
        payload: {
            id: uid,
        },
    };
};