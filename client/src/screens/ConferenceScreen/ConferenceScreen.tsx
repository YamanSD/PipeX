import React, {useEffect, useRef, useState} from "react";
import {
    Component,
    Generic, KnownPeers,
    MeetingFooter,
    ParticipantGrid,
    StateSetter,
    UpdatePreferences,
    UserPreference
} from "../../components";
import "./ConferenceScreen.css";
import {connect} from "react-redux";
import {Emitter, Http, Listener, LocalStorage, RootState, updateUser, UserType} from "../../services";
import {toast} from "react-toastify";
import {useLocation, useNavigate} from "react-router-dom";
import {setKnownPeers} from "../../services/store/ActionCreator";

/**
 * Type alias for the component props.
 */
type Properties = {
    participants: Generic<UserType>,
    currentUser: UserType,
    updateUser: (u: any) => any,
    setShowNavBar: StateSetter<boolean>
};

const ConferenceScreen = (props: Properties) => {
    const participantRef = useRef(props.participants);
    const [myStream, setMyStream] = useState<MediaStream | undefined>();
    const navigation = useNavigate();
    const location = useLocation();
    const hasLoaded = useRef(false);
    const locationState = location.state as {
        sessionId: number | string,
        creator: string,
        sessionPassword?: string,
        initUsers: {[uid: string]: any}
    };

    const setVideo = (stream: MediaStream, value: boolean) => {
        stream.getVideoTracks()[0].enabled = value;
    };

    const setAudio = async (stream: MediaStream, value: boolean) => {
        stream.getAudioTracks()[0].enabled = value;
        await stream.getAudioTracks()[0].applyConstraints({
            noiseSuppression: true,
            echoCancellation: true,
        });
    };


    /* on termination listener */
    useEffect(() => {
        Listener.onTermination(() => {
            toast.info("Session terminated", {
                toastId: 'termSuccess',
            });
            const user = LocalStorage.getUser();

            if (user) {
                user.currentRoom = undefined;
                LocalStorage.setUser(user);
            }

            navigation('/home');
        });
    }, [navigation]);

    /* hides app navbar */
    useEffect(() => {
        props.setShowNavBar(false);
    }, [location.pathname, props.setShowNavBar]);

    useEffect(() => {
        if (!hasLoaded.current) {
            hasLoaded.current = true;

            navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            }).then((stream) => {
                setVideo(stream, props.currentUser.preferences.video);
                setAudio(stream, props.currentUser.preferences.audio).then(() => {
                    setMyStream(stream);
                });
            });
        }
    }, []);

    const updatePreferences = async (newPref: UpdatePreferences) => {
        const actualPref: UserPreference = {
            ...props.currentUser.preferences,
            ...newPref
        };

        return new Promise<boolean>(resolve => {
            Emitter.updatePreference(actualPref, (res) =>{
                if (res.response === Http.OK) {
                    resolve(true);
                } else {
                    toast.error(`Couldn't update preferences! (${res.response})`, {
                        autoClose: false
                    });
                    resolve(false);
                }
            });
        });
    };

    const onLeaveClick = () => {
        navigation("/home");
    };

    const onMicClick = async (micEnabled: boolean) => {
        if (myStream) {
            await setAudio(myStream, micEnabled)
            props.updateUser({ audio: micEnabled });

            return await updatePreferences({
                audio: micEnabled
            });
        }

        return false;
    };
    const onVideoClick = async (videoEnabled: boolean) => {
        if (myStream) {
            if (!props.currentUser.preferences.screen) {
                setVideo(myStream, videoEnabled);
            }
            props.updateUser({ video: videoEnabled });

            return await updatePreferences({
                video: videoEnabled
            });
        }

        return false;
    };

    useEffect(() => {
        participantRef.current = props.participants;
    }, [props.participants]);

    const onScreenClick = async (value: boolean) => {
        if (myStream) {
            props.updateUser({ screen: value });

            return await updatePreferences({
                screen: value
            });
        }

        return false;
    }

    return (
        <div className="wrapper" style={{
            padding: 0,
            margin: 0,
        }}>
            <div className="main-screen">
                <ParticipantGrid locationState={locationState}
                                 setMyStream={setMyStream}
                                 myStream={myStream as MediaStream}
                />
            </div>

            <div className="footer">
                <MeetingFooter
                    initPreferences={props.currentUser?.preferences ?? {video: false, audio: false, screen: false}}
                    onScreenClick={onScreenClick}
                    onMicClick={onMicClick}
                    onVideoClick={onVideoClick}
                    ConferenceInfo={{
                        creator: locationState.creator ?? LocalStorage.getUser()?.uid ?? "err",
                        password: locationState.sessionPassword ?? "",
                        sessionId: `${locationState.sessionId}`,
                    }}
                    onLeaveClick={onLeaveClick}
                />
            </div>
        </div>
    );
};

const mapStateToProps = (state: RootState) => {
    return {
        participants: state.user.participants,
        currentUser: state.user.currentUser,
        peers: state.knownPeers.peers
    };
};

const mapDispatchToProps = (dispatch: (_: any) => any) => {
    return {
        setPeers: (peers: KnownPeers) => dispatch(setKnownPeers(peers)),
        updateUser: (user: any) => dispatch(updateUser(user)),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(ConferenceScreen) as Component;
