import React, {useEffect, useRef, useState} from "react";
import {
    Component, FadingText,
    Generic,
    KnownPeers,
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
import SpeechRecognition, {useSpeechRecognition} from 'react-speech-recognition';


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
    const {
        transcript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition();
    const [activeCc, setActiveCc] = useState(false);
    const transcripts = useRef<{sender: string, message: string}[]>([]);
    const [renderTranscripts, setRenderTranscripts] = useState(transcripts.current);

    /* warn user */
    if (!browserSupportsSpeechRecognition) {
        toast.warn("Browser doesn't support speech recognition. Others won't see your transcription.");
    }

    const setVideo = (stream: MediaStream, value: boolean) => {
        stream.getVideoTracks()[0].enabled = value;
    };

    const setAudio = async (stream: MediaStream, value: boolean) => {
        stream.getAudioTracks()[0].enabled = value;

        if (value) {
            SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
        } else {
            SpeechRecognition.stopListening();
        }

        await stream.getAudioTracks()[0].applyConstraints({
            noiseSuppression: true,
            echoCancellation: true,
        });
    };

    useEffect(() => {
        if (props.currentUser.preferences.audio && transcript) {
            Emitter.sendTranscript(transcript, (res) => {
                if (res.response !== Http.OK) {
                    toast.error(`Couldn't send transcript! (${res.err})`);
                }
            });
        }
    }, [transcript, props.currentUser]);

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

    useEffect(() => {
        Listener.onTranscript((args) => {
            transcripts.current.push(args);
            setRenderTranscripts([ ...transcripts.current ]);
        });
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

    const onSubtitlesClick = (value: boolean) => {
        setActiveCc(value);
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
            {
                activeCc && <div id={"transcripts"}
                     style={{
                         pointerEvents: "none",
                         width: "100%",
                         display: "flex",
                         flexDirection: "column-reverse",
                         alignItems: "center",
                         height: "100%",
                         position: "absolute",
                         top: "0",
                         left: "0",
                         zIndex: 500
                     }}
                >
                    {renderTranscripts.map(t => <FadingText text={t.message} sender={t.sender} />)}
                </div>
            }
            <div className="main-screen">
                <ParticipantGrid locationState={locationState}
                                 setMyStream={setMyStream}
                                 myStream={myStream as MediaStream}
                                 setAudio={setAudio}
                                 setVideo={setVideo}
                />
            </div>

            <div className="footer">
                <MeetingFooter
                    onSubtitleClick={onSubtitlesClick}
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
