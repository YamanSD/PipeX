import React, {useEffect, useRef, useState} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faMicrophone,
    faVideo,
    faDesktop,
    faVideoSlash,
    faMicrophoneSlash,
} from "@fortawesome/free-solid-svg-icons";
import "./MeetingFooter.css";
import {UserPreference} from "../types";

/**
 * Type alias for the component props.
 */
type Properties = {
    onMicClick: (value: boolean) => Promise<boolean>,
    onVideoClick: (value: boolean) => Promise<boolean>,
    onScreenClick: (value: boolean) => Promise<boolean>,
    initPreferences: UserPreference
}

/**
 * @param props
 * @constructor
 */
const MeetingFooter = (props: Properties) => {
    const preferences = useRef({ ...props.initPreferences });

    const micClick = async () => {
        const newValue = !preferences.current.audio;
        const res = await props.onMicClick(newValue);

        if (res) {
            preferences.current.audio = newValue;
        }
    };

    const onVideoClick = async () => {
        const newValue = !preferences.current.video;
        const res = await props.onVideoClick(newValue);

        if (res) {
            preferences.current.video = newValue;
        }
    };

    const onScreenClick = async () => {
        const newValue = !preferences.current.screen;
        const res = await props.onScreenClick(newValue);

        if (res) {
            preferences.current.screen = newValue;
        }
    };

    return (
        <div className="meeting-footer">
            <div
                className={"meeting-icons " + (!preferences.current.audio ? "active" : "")}
                data-tip={preferences.current.audio ? "Mute Audio" : "Unmute Audio"}
                onClick={micClick}
            >
                <FontAwesomeIcon
                    icon={!preferences.current.audio ? faMicrophoneSlash : faMicrophone}
                    title="Mute"
                />
            </div>
            <div
                className={"meeting-icons " + (!preferences.current.video ? "active" : "")}
                data-tip={preferences.current.video ? "Hide Video" : "Show Video"}
                onClick={onVideoClick}
            >
                <FontAwesomeIcon icon={!preferences.current.video ? faVideoSlash : faVideo} />
            </div>
            <div
                className={"meeting-icons"}
                data-tip="Share Screen"
                style={{
                    pointerEvents: preferences.current.screen ? "none" : undefined
                }}
                onClick={onScreenClick}
            >
                <FontAwesomeIcon icon={faDesktop} />
            </div>
        </div>
    );
};

export default MeetingFooter;
