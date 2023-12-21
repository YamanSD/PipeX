import React, {useEffect, useRef, useState} from "react";
import {Surface} from "../../index";
import {faMicrophoneSlash} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import "./Participant.css";

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
    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
        if (videoRef.current && stream) {
            // Adjust this threshold to suit your needs
            const VOLUME_THRESHOLD = 20;
            const AUDIO_WINDOW_SIZE = 256;

            videoRef.current.srcObject = stream;

            // @ts-ignore, webkit for Safari
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const mediaStreamSource = audioContext.createMediaStreamSource(stream);

            // Create an analyser node to process audio data
            const analyserNode = audioContext.createAnalyser();
            // Window size in samples that is used when performing a Fast Fourier Transform (FFT),
            // to get frequency domain data
            analyserNode.fftSize = AUDIO_WINDOW_SIZE;
            mediaStreamSource.connect(analyserNode);

            // Buffer to hold the audio data
            const bufferLength = analyserNode.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            // Function to process audio data and detect the active speaker
            const processAudio = () => {
                analyserNode.getByteFrequencyData(dataArray);

                // Implement your active speaker detection algorithm here
                // For example, you can calculate the average volume of the audio data and use a threshold

                // Example: Calculate the average volume
                const averageVolume = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;
                setIsSpeaking(averageVolume > VOLUME_THRESHOLD);

                // Repeat the process for the next audio frame
                requestAnimationFrame(processAudio);
            };

            // Start the audio processing loop
            processAudio();
        }
    }, [videoRef.current, stream]);

    return (
        <div
            key={`${username}${currentIndex}`}
            className={`participant`}>
            <Surface>
                <video
                    ref={videoRef}
                    className={`video ${isSpeaking ? "speaking" : ""}`}
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
                {!preferences.video && !preferences.screen && (
                    <div
                        style={{ background: '#3498ff' }}
                        className="avatar"
                    >
                        {username[0]}
                    </div>
                )}
                <div className="name">
                    {username}
                    {isCurrent ? " (You)" : ""}
                </div>
            </Surface>
        </div>
    );
};
