import ActionType from "./ActionType";
import {ActionInputType, defaultPeerState, PeerStateType} from "./ActionCreator";
import {Reducer} from "redux";


/**
 * @param state current state of the reducer.
 * @param action requested on the state.
 * @constructor
 */
const PeersReducer = ((state = defaultPeerState, action: ActionInputType<PeerStateType>) => {
    const peers = action.payload?.peers;

    if (peers) {
        const finalData: typeof peers = {};
        const peerIds = Object.keys(peers);

        for (const peerId of peerIds) {
            finalData[peerId] = {
                data: { ...peers[peerId].data },
            };
        }

        switch (action.type) {
            case ActionType.SetPeers:
                state = { ...state, peers: finalData };
                break;
        }
    }

    return state;
}) as any as Reducer<any, any, PeerStateType>;

export default PeersReducer;
