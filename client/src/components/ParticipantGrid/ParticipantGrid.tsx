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
    updateParticipant, updateUser,
    UserType
} from "../../services";
import {toast} from "react-toastify";
import Peer from "peerjs";
import {Component, KnownPeers, StateSetter, UserPeerInfo} from "../types";
import {Participant} from "./Participant/Participant";
import {setKnownPeers} from "../../services/store/ActionCreator";

/**
 * Type alias for the component props.
 */
type Properties = {
    myStream: MediaStream,
    setMyStream: StateSetter<MediaStream | undefined>,
    currentUser: UserType,
    updateUser: (u: any) => any,
    setPeers: (peers: KnownPeers) => any,
    locationState: {
        sessionId: number | string,
        creator: string,
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
const ParticipantGrid = ({
     myStream,
     setPeers,
     currentUser,
     locationState,
     setMyStream,
     updateUser
}: Properties) => {
    const myPeer = useRef<Peer>(Emitter.refreshPeer());
    const [gridCol, setGridCol] = useState(0);
    const [gridColSize, setGridColSize] = useState(0);
    const [gridRowSize, setGridRowSize] = useState(0);

    /* object containing all the discovered peers and their info */
    const knownPeers = useRef<KnownPeers>({});

    /* used to store the most recent preferences for the user */
    const preferences = useRef(currentUser.preferences);

    /* true if the user is sharing their screen */
    const isSharing = useRef(false);

    /* used for rendering and updating the front-end */
    const [renderPeers, setRenderPeers] = useState(knownPeers.current);

    const rerenderPeers = (peers: typeof knownPeers.current) => {
        setPeers(peers);
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
            toast.info(`${knownPeers.current[peerId].data.uid} left`);

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

    useEffect(() => {
        preferences.current = currentUser.preferences;

        if (currentUser?.preferences.screen && !isSharing.current) {
            isSharing.current = true;

            /**
             *
             * @param stream new user stream (myStream).
             * @param addAudio if true adds the myStream audio track to the new stream.
             */
            const updateMyStream = (stream: MediaStream, addAudio?: boolean) => {
                /* keep same audio track */
                if (addAudio) {
                    stream.addTrack(myStream.getAudioTracks()[0]);
                }

                for (let peerId of Object.keys(knownPeers.current)) {
                    const sender = knownPeers.current[peerId];

                    if (peerId.length === 0) {
                        // Current user
                        continue;
                    }

                    const peerConnection = sender.call?.peerConnection
                        .getSenders()
                        .find((s: RTCRtpSender) => (s.track ? s.track.kind === "video" : false));

                    peerConnection?.replaceTrack(stream.getVideoTracks()[0]);

                    const audioPeerConnection = sender.call?.peerConnection
                        .getSenders()
                        .find((s: RTCRtpSender) => (s.track ? s.track.kind === "audio" : false));

                    audioPeerConnection?.replaceTrack(stream.getAudioTracks()[0]);
                }

                setMyStream(stream);
            };

            const onScreenShareEnd = async () => {
                isSharing.current = false;

                const localStream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: true,
                });

                localStream.getVideoTracks()[0].enabled = preferences.current.video;
                localStream.getAudioTracks()[0].enabled = preferences.current.audio;

                updateMyStream(localStream);
                updateUser({ screen: false });
            };

            const onScreenClick = async () => {
                let mediaStream;

                try {
                    // @ts-ignore, get a share screen stream
                    if (navigator.getDisplayMedia) {
                        // @ts-ignore
                        mediaStream = await navigator.getDisplayMedia({ video: true });
                    } else if (navigator.mediaDevices.getDisplayMedia) {
                        mediaStream = await navigator.mediaDevices.getDisplayMedia({
                            video: true,
                        });
                    } else {
                        mediaStream = await navigator.mediaDevices.getUserMedia({
                            // @ts-ignore
                            video: { mediaSource: "screen" },
                        });
                    }
                } catch (e) {
                    isSharing.current = false;
                    updateUser({ screen: false });
                    return;
                }

                mediaStream.getVideoTracks()[0].onended = onScreenShareEnd;
                updateMyStream(mediaStream, true);
            };

            onScreenClick();
        }
    }, [currentUser]);

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
        updateUser: (user: any) => dispatch(updateUser(user)),
        setPeers: (peers: KnownPeers) => dispatch(setKnownPeers(peers)),
        removeParticipant: (uid: string) => dispatch(removeParticipant(uid)),
        updateParticipant: (user: UserType) => dispatch(updateParticipant(user)),
    };
};

/**
 * Type alias for the properties that are needed from parent.
 */
type InputProperties = {
    myStream: Properties['myStream'],
    locationState: Properties['locationState'],
    setMyStream: Properties['setMyStream']
};

export default connect(mapStateToProps, mapDispatchToProps)(ParticipantGrid) as Component<InputProperties>;
