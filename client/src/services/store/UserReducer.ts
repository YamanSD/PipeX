import ActionType from "./ActionType";
import {UserType, defaultUserState, StateType, ActionInputType} from "./ActionCreator";
import {Reducer} from "redux";


/**
 * @param state current state of the reducer.
 * @param action requested on the state.
 * @constructor
 */
const UserReducer = ((state = defaultUserState, action: ActionInputType) => {
    const payload = action.payload;
    let newUser: UserType;
    let participants: {[uid: string]: UserType};

    switch (action.type) {
        case ActionType.AddParticipant:
            newUser = payload.newUser;

            state = {...state, participants: {
               ...state.participants,
               [newUser.uid]: newUser
            }};
            break;
        case ActionType.RemoveParticipant:
            const id: string = payload.id;
            participants = { ...state.participants };

            delete participants[id];

            state = {
                ...state,
                participants: {
                    ...participants
                }
            };
            break;
        case ActionType.SetUser:
            state = { ...state, currentUser: payload.currentUser };
            break;
        case ActionType.UpdateUser:
            state = { ...state,
                currentUser: {
                    ...state.currentUser,
                    preferences: {
                        ...state.currentUser?.preferences,
                        ...payload.newPrefs
                    }
                } as UserType
            };
            break;
        case ActionType.UpdateParticipant:
            newUser = payload.newUser;

            state = {...state, participants: {
                ...state.participants,
                [newUser.uid]: newUser
            }};
            break;
    }

    return state;
}) as any as Reducer<any, any, StateType>;

export default UserReducer;
