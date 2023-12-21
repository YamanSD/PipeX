import React, {useEffect, useRef} from "react";
import { Surface } from "../../index";
import { faMicrophoneSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./Participant.css";
import {toast} from "react-toastify";

/**
 * Type alias for the Participant component.
 */
type Properties = {
    currentIndex: number,
    username: string,
    preferences: {
        audio: boolean,
        video: boolean,
        screen: boolean
    },
    isCurrent: boolean,
    stream?: MediaStream
};

/**
 * @param isCurrent
 * @param username
 * @param currentIndex
 * @param preferences
 * @param stream
 * @constructor
 */
export const Participant = ({
        isCurrent,
        username,
        currentIndex,
        preferences,
        stream
}: Properties) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            toast.info(`SET STREAM; ${username} || ${stream.id}`, {autoClose: false})
            videoRef.current.srcObject = stream;
        }
    }, [videoRef.current, stream]);

    return (
        <div className={`participant ${preferences.screen ? "hide" : ""}`}>
            <Surface>
                <video
                    ref={videoRef}
                    className="video"
                    id={`participantVideo${currentIndex}`}
                    autoPlay
                    playsInline
                    muted={isCurrent}
                />
                {!preferences.audio && (
                    <FontAwesomeIcon
                        className="muted"
                        icon={faMicrophoneSlash}
                        title="Muted"
                    />
                )}
                {!preferences.video && (
                    <div
                        style={{ background: '#3498ff' }}
                        className="avatar"
                    >
                        {username[0]}
                    </div>
                )}
                <div className="name">
                    {username}
                    {isCurrent ? "(You)" : ""}
                </div>
            </Surface>
        </div>
    );
};
