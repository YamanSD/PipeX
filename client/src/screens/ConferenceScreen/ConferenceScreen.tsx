import React, {useEffect, useRef, useState} from "react";
import {
    Component,
    Generic,
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
        create: boolean,
        sessionPassword?: string,
        initUsers: {[uid: string]: any}
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

    const setVideo = (stream: MediaStream, value: boolean) => {
        stream.getVideoTracks()[0].enabled = value;
    };

    const setAudio = (stream: MediaStream, value: boolean) => {
        stream.getAudioTracks()[0].enabled = value;
    };

    useEffect(() => {
        if (!hasLoaded.current) {
            hasLoaded.current = true;

            navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            }).then((stream) => {
                setVideo(stream, props.currentUser.preferences.video);
                setAudio(stream, props.currentUser.preferences.audio);
                setMyStream(stream);
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

    const onMicClick = async (micEnabled: boolean) => {
        if (myStream) {
            setAudio(myStream, micEnabled);
            props.updateUser({ audio: micEnabled });

            return await updatePreferences({
                audio: micEnabled
            });
        }

        return false;
    };
    const onVideoClick = async (videoEnabled: boolean) => {
        if (myStream) {
            setVideo(myStream, videoEnabled);
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

    const updateStream = (stream: MediaStream) => {
        // for (let key in participantRef.current) {
        //     const sender = participantRef.current[key];
        //     if (sender.isCurrent) continue;
        //     const peerConnection = sender.peerConnection
        //         .getSenders()
        //         .find((s: RTCRtpSender) => (s.track ? s.track.kind === "video" : false));
        //
        //     peerConnection.replaceTrack(stream.getVideoTracks()[0]);
        // }
        // setMyStream(stream);
    };

    const onScreenShareEnd = async () => {
        // const localStream = await navigator.mediaDevices.getUserMedia({
        //     audio: true,
        //     video: true,
        // });
        //
        // // @ts-ignore
        // localStream.getVideoTracks()[0].enabled = Object.values(
        //     props.currentUser
        // )[0].video;
        //
        // updateStream(localStream);
        //
        // props.updateUser({ screen: false });
    };

    const onScreenClick = async (value: boolean) => {
        // let mediaStream;
        //
        // // @ts-ignore
        // if (navigator.getDisplayMedia) {
        //     // @ts-ignore
        //     mediaStream = await navigator.getDisplayMedia({ video: true });
        // } else if (navigator.mediaDevices.getDisplayMedia) {
        //     mediaStream = await navigator.mediaDevices.getDisplayMedia({
        //         video: true,
        //     });
        // } else {
        //     mediaStream = await navigator.mediaDevices.getUserMedia({
        //         // @ts-ignore
        //         video: { mediaSource: "screen" },
        //     });
        // }
        //
        // mediaStream.getVideoTracks()[0].onended = onScreenShareEnd;
        //
        // updateStream(mediaStream);
        //
        // props.updateUser({ screen: true });
        return await updatePreferences({
            screen: value
        });
    };
    return (
        <div className="wrapper">
            <div className="main-screen">
                <ParticipantGrid locationState={locationState}
                                 myStream={myStream as MediaStream}
                />
            </div>

            <div className="footer">
                <MeetingFooter
                    initPreferences={props.currentUser?.preferences ?? {video: false, audio: false, screen: false}}
                    onScreenClick={onScreenClick}
                    onMicClick={onMicClick}
                    onVideoClick={onVideoClick}
                />
            </div>
        </div>
    );
};

const mapStateToProps = (state: RootState) => {
    return {
        participants: state.user.participants,
        currentUser: state.user.currentUser,
    };
};

const mapDispatchToProps = (dispatch: (_: any) => any) => {
    return {
        updateUser: (user: any) => dispatch(updateUser(user)),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(ConferenceScreen) as Component;
