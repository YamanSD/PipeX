import React, {useEffect, useRef, useState} from "react";
import "./ParticipantGrid.css";
import {connect} from "react-redux";
import {
    addParticipant,
    Emitter,
    Http,
    Listener,
    LocalStorage,
    removeParticipant,
    RootState,
    setUser,
    updateParticipant,
    UserType
} from "../../services";
import {toast} from "react-toastify";
import Peer, {MediaConnection} from "peerjs";
import {Component, UserPeerInfo} from "../types";
import {Participant} from "./Participant/Participant";

/**
 * Type alias for the component props.
 */
type Properties = {
    myStream: MediaStream,
    currentUser: UserType,
    locationState: {
        sessionId: number | string,
        create: boolean,
        sessionPassword?: string,
        initUsers: {[uid: string]: any}
    }
};

/**
 *
 * @param participants already in the conference room.
 * @param myStream
 * @param currentUser
 * @constructor
 */
const ParticipantGrid = ({myStream, currentUser, locationState}: Properties) => {
    const myPeer = useRef<Peer>(Emitter.refreshPeer());
    const [gridCol, setGridCol] = useState(0);
    const [gridColSize, setGridColSize] = useState(0);
    const [gridRowSize, setGridRowSize] = useState(0);

    /* object containing all the discovered peers and their info */
    const knownPeers = useRef<{[uid: string]: {
            call?: MediaConnection,
            stream?: MediaStream,
            data: UserPeerInfo
        }}>({});

    /* used for rendering and updating the front-end */
    const [renderPeers, setRenderPeers] = useState(knownPeers.current);

    const rerenderPeers = (peers: typeof knownPeers.current) => {
        setRenderPeers({ ...peers });
    };

    /* used for triggering the listeners only once */
    const hasConnected = useRef(false);

    /* when the new users flag is triggered, re-calculate the dimensions */
    useEffect(() => {
        /* uids of discovered peers */
        const participantCount = Object.keys(renderPeers).length;

        setGridCol(participantCount === 1 ? 1 : participantCount <= 4 ? 2 : 4);
        setGridColSize(participantCount <= 4 ? 1 : 2);
        setGridRowSize(
            participantCount <= 4
                ? participantCount
                : Math.ceil(participantCount / 2)
        );
    }, [renderPeers]);

    /**
     *
     * @param user
     */
    const connectNewUser = (user?: UserPeerInfo) => {
        if (!user || user.uid === LocalStorage.getUser()?.uid) {
            // Don't redisplay self
            return;
        }

        /* call the user that joined */
        const call = myPeer.current.call(user.peerId, myStream);

        call.on('error', err => {
            toast.error(`Call error. (${err})`, {
                autoClose: false
            });
        });

        call.on('stream', userVideoStream => {
            knownPeers.current[user.peerId].stream = userVideoStream;
            rerenderPeers(knownPeers.current);
        });

        call.on('close', () => {
            removeUser(call.peer);
        });

        knownPeers.current[user.peerId].call = call;
    };

    const removeUser = (peerId: string) => {
        if (knownPeers.current[peerId]) {
            knownPeers.current[peerId].call?.close();
            delete knownPeers.current[peerId];

            rerenderPeers(knownPeers.current);
        }
    };

    useEffect(() => {
        if (currentUser && myStream) {
            /* add the user stream */
            knownPeers.current[''] = {
                stream: myStream,
                data: {
                    uid: currentUser.uid,
                    preferences: { ...currentUser.preferences },
                    peerId: '' // Not needed
                }
            };

            if (!hasConnected.current) {
                hasConnected.current = true;

                myPeer.current.on('call', call => {
                    if (!(call.peer in knownPeers.current)) {
                        knownPeers.current[call.peer] = {
                            data: locationState.initUsers[call.peer]
                        };
                    }

                    /* answer the call, and send back our stream */
                    call.answer(myStream);

                    /* when we receive the user stream we added it to the element */
                    call.on('stream', userVideoStream => {
                        if (call.peer in knownPeers.current
                            && !knownPeers.current[call.peer].call) {
                            knownPeers.current[call.peer].call = call;
                            knownPeers.current[call.peer].stream = userVideoStream;
                            rerenderPeers(knownPeers.current);
                        }
                    });
                });

                Listener.onJoin((args) => {
                    knownPeers.current[args.peerId] = {
                        data: args,
                        call: undefined
                    };
                    rerenderPeers(knownPeers.current);
                });

                Listener.onReady(({peerId}) => {
                    connectNewUser(knownPeers.current[peerId]?.data);
                });

                Listener.onLeave((args) => {
                    removeUser(args.peerId);
                });

                Listener.onPreference((args) => {
                   if (args.uid !== LocalStorage.getUser()?.uid) {
                       knownPeers.current[args.peerId].data.preferences = args.value;
                       rerenderPeers(knownPeers.current);
                   }
                });

                Emitter.ready((res) => {
                    if (res.response !== Http.OK) {
                        toast.warn(`Couldn't ready (${res.response})`);
                    } else {
                        rerenderPeers(knownPeers.current);
                    }
                });
            } else {
                rerenderPeers(knownPeers.current);
            }
        }
    }, [myStream, currentUser]);

    return (
        <div
            style={{
                // @ts-ignore
                "--grid-size": gridCol,
                "--grid-col-size": gridColSize,
                "--grid-row-size": gridRowSize,
            }}
            className={`participants`}
        >
            {
                Object.keys(renderPeers).map((peerId, index) => {
                    return <Participant currentIndex={index}
                                        username={renderPeers[peerId].data.uid}
                                        preferences={renderPeers[peerId].data.preferences}
                                        isCurrent={renderPeers[peerId].data.uid === LocalStorage.getUser()?.uid}
                                        stream={renderPeers[peerId].stream}
                    />;
                })
            }
        </div>
    );
};

const mapStateToProps = (state: RootState) => {
    return {
        participants: state.user.participants,
        currentUser: state.user.currentUser,
    };
};

/**
 * @param dispatch
 */
const mapDispatchToProps = (dispatch: (...arg: any[]) => any) => {
    return {
        addParticipant: (user: UserType) => dispatch(addParticipant(user)),
        setUser: (user: UserType) => dispatch(setUser(user)),
        removeParticipant: (uid: string) => dispatch(removeParticipant(uid)),
        updateParticipant: (user: UserType) => dispatch(updateParticipant(user)),
    };
};

/**
 * Type alias for the properties that are needed from parent.
 */
type InputProperties = {
    myStream: Properties['myStream'],
    locationState: Properties['locationState']
};

export default connect(mapStateToProps, mapDispatchToProps)(ParticipantGrid) as Component<InputProperties>;
