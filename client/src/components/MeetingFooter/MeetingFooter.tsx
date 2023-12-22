import React, {useEffect, useState} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faMicrophone,
    faShield,
    faVideo,
    faDesktop,
    faClosedCaptioning,
    faVideoSlash,
    faMicrophoneSlash,
    faDoorOpen,
    faDoorClosed,
} from "@fortawesome/free-solid-svg-icons";
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
import "./MeetingFooter.css";
import {Component, UpdatePreferences, UserPreference} from "../types";
import {FiCopy} from "react-icons/fi";
import {Button} from "@mui/material";
import {RootState, UserType} from "../../services";
import {connect} from "react-redux";

/**
 * Type alias for the component props.
 */
type Properties = {
    onMicClick: (value: boolean) => Promise<boolean>,
    onVideoClick: (value: boolean) => Promise<boolean>,
    onScreenClick: (value: boolean) => Promise<boolean>,
    onLeaveClick: () => any,
    onSubtitleClick: (value: boolean) => any,
    ConferenceInfo: {
        sessionId: string,
        password: string,
        creator: string,
    },
    initPreferences: UserPreference,
    currentUser?: UserType
}

/**
 * @param props
 * @constructor
 */
const MeetingFooter = (props: Properties) => {
    const [preferences, setPreferences] = useState({ ...props.initPreferences });
    const [hoverOnLeave, setHoverOnLeave] = useState(false);
    const [activeSubtitles, setActiveSubtitles] = useState(false);

    const handleSetPreferences = (value: UpdatePreferences) => {
        setPreferences({ ...preferences, ...value });
    };

    useEffect(() => {
        if (props.currentUser) {
            handleSetPreferences(props.currentUser.preferences);
        }
    }, [props.currentUser]);


    const micClick = async () => {
        const newValue = !preferences.audio;
        const res = await props.onMicClick(newValue);

        if (res) {
            handleSetPreferences({ audio: newValue });
        }
    };

    const onVideoClick = async () => {
        const newValue = !preferences.video;
        const res = await props.onVideoClick(newValue);

        if (res) {
            handleSetPreferences({ video: newValue });
        }
    };

    const onScreenClick = async () => {
        const newValue = !preferences.screen;
        const res = await props.onScreenClick(newValue);

        if (res) {
            handleSetPreferences({ screen: newValue });
        }
    };

    return (
        <div className="meeting-footer">
            <button
                className={`meeting-icons ${hoverOnLeave ? "active" : ""} leave-btn`}
                data-tip={"Leave session"}
                onClick={props.onLeaveClick}
                onMouseEnter={() => {
                    setHoverOnLeave(true);
                }}
                onMouseLeave={() => {
                    setHoverOnLeave(false);
                }}
            >
                <FontAwesomeIcon
                    icon={hoverOnLeave ? faDoorOpen : faDoorClosed}
                    title="Share meeting"
                />
            </button>
            <button
                className={"meeting-icons " + (!preferences.audio ? "active" : "")}
                data-tip={preferences.audio ? "Mute Audio" : "Unmute Audio"}
                onClick={micClick}
            >
                <FontAwesomeIcon
                    icon={!preferences.audio ? faMicrophoneSlash : faMicrophone}
                    title="Mute"
                />
            </button>
            <button
                className={"meeting-icons " + (!preferences.video ? "active" : "")}
                data-tip={preferences.video ? "Hide Video" : "Show Video"}
                onClick={onVideoClick}
            >
                <FontAwesomeIcon icon={!preferences.video ? faVideoSlash : faVideo} />
            </button>
            <button
                className={"meeting-icons " + (preferences.screen ? "active-blue" : "")}
                data-tip="Share Screen"
                style={{
                    pointerEvents: preferences.screen ? "none" : undefined
                }}
                onClick={onScreenClick}
            >
                <FontAwesomeIcon icon={faDesktop} />
            </button>
            <button
                className={"meeting-icons " + (activeSubtitles ? "active-blue" : "")}
                data-tip="Activate subtitles"
                onClick={() => {
                    props.onSubtitleClick(!activeSubtitles);
                    setActiveSubtitles(!activeSubtitles);
                }}
            >
                <FontAwesomeIcon icon={faClosedCaptioning} />
            </button>
            <Popup
                className={"modal"}
                modal
                position={"center center"}
                trigger={
                <button
                    className={"meeting-icons"}
                    data-tip="Share conference"
                    style={{
                        position: "fixed",
                        right: 0,
                        bottom: 0,
                        borderRadius: "10px"
                    }}
                >
                    <FontAwesomeIcon icon={faShield} />
                </button>
            }>
                <div style={{
                    padding: "20px",
                    border: "1px solid #3498ff",
                    borderRadius: "10px",
                    backgroundColor: "#101010",
                    height: "50%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "space-evenly",
                }}>
                    <div style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        alignContent: "center",
                        justifyContent: "space-evenly",
                        marginBottom: "10px",
                        width: "10%"
                    }}>
                      <span style={{
                          color: "white"
                      }}>
                          Creator:
                      </span>
                      <div style={{minWidth: "10px"}}></div>
                      <span style={{
                          color: "#3498ff",
                          fontWeight: "bold"
                      }}>
                          {props.ConferenceInfo.creator}
                      </span>
                    </div>
                    <div style={{
                        marginBottom: "10px"
                    }}>
                        <Button
                            onClick={() => navigator.clipboard.writeText(`${props.ConferenceInfo.password}`)}
                            variant="contained"
                            endIcon={<FiCopy size={16} />}
                        >
                            Copy Password
                        </Button>
                    </div>
                    <div >
                        <Button
                            onClick={() => navigator.clipboard.writeText(`${props.ConferenceInfo.sessionId}`)}
                            variant="contained"
                            endIcon={<FiCopy size={16} />}
                        >
                            Copy Session Id
                        </Button>
                    </div>
                </div>
            </Popup>
        </div>
    );
};

const mapStateToProps = (state: RootState) => {
    return {
        currentUser: state.user.currentUser,
    };
};

/**
 * Type alias for the properties that are needed from parent.
 */
type InputProperties = Properties;

export default connect(mapStateToProps)(MeetingFooter) as Component<InputProperties>;
