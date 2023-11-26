import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faMicrophone,
    faVideo,
    faDesktop,
    faVideoSlash,
    faDoorOpen,
    faDoorClosed,
    faMicrophoneSlash,
} from '@fortawesome/free-solid-svg-icons';
import styles from './ActionBar.module.css';
import {FiCopy} from "react-icons/fi";
import {Button} from "@mui/material";


/**
 * Type alias for the prop-type of the component.
 */
type Properties = {
    mic: boolean,
    cam: boolean,
    onMicChange: (v: boolean) => any,
    onCamChange: (v: boolean) => any,
    onLeave: () => any,
    onIdClick: () => any,
    onPassClick: () => any,
    onShareScreenChange: (newValue: boolean, setter: React.Dispatch<React.SetStateAction<boolean>>) => any,
};

/**
 * Action bar for the media control.
 *
 * @param onShareScreenChange callback function takes new value of
 *        the share screen state, & the state setter.
 * @param onMicChange callback function takes the new value of the mic state.
 * @param onCamChange callback function takes the new value of the cam state.
 * @param cam state of the camera.
 * @param mic state of the mic.
 * @param onLeave called when the leave button is pressed.
 * @param onIdClick triggered when the user clicks the ID button.
 * @param onPassClick triggered when the user clicks the pass button.
 * @constructor
 */
const ActionBar = ({onShareScreenChange, onMicChange,
                       onCamChange, cam, mic, onLeave,
                       onIdClick, onPassClick}: Properties) => {
    /* state for the share screen, true on, false off. */
    const [screen, setScreen] = useState<boolean>(false);

    /* used by door icon */
    const [open, setOpen] = useState(false)

    /* callback function for the mic btn */
    const onMicClick = () => {
        onMicChange(!mic);
    };

    /* callback function for the cam btn */
    const onCamClick = () => {
        onCamChange(!cam);
    };

    /* callback function for the share screen btn */
    const onShareScreenClick = () => {
        onShareScreenChange(!screen, setScreen);
    };

    return (
        <div className={styles.main__container}>
            {/* Leave btn */}
            <div
                className={`${styles.icon} ${styles.major__icon}`}
                data-top={"Leave"}
                onClick={onLeave}
                onMouseEnter={() => setOpen(true)}
                onMouseLeave={() => setOpen(false)}
            >
                <FontAwesomeIcon
                    icon={open ? faDoorOpen : faDoorClosed}
                />
            </div>
            {/* Audio btn */}
            <div
                className={`${styles.icon} ${mic ? styles.active__icon : ""}`}
                data-top={`${(mic ? "Mute" : "Unmute")} Audio`}
                onClick={onMicClick}
            >
                <FontAwesomeIcon
                    icon={mic ? faMicrophone : faMicrophoneSlash}
                />
            </div>

            {/* Camera btn */}
            <div
                className={`${styles.icon} ${cam ? styles.active__icon : ""}`}
                data-top={`${(cam ? "Hide" : "Show")} Audio`}
                onClick={onCamClick}
            >
                <FontAwesomeIcon
                    icon={cam ? faVideo : faVideoSlash}
                />
            </div>

            {/* Camera btn */}
            <div
                className={`${styles.cpy__icon}`}
                data-top={`${(cam ? "Hide" : "Show")} Audio`}
                onClick={onIdClick}
            >
                <p>ID</p>
                <FiCopy size={16} />
            </div>

            <div
                className={`${styles.cpy__icon}`}
                data-top={`${(cam ? "Hide" : "Show")} Audio`}
                onClick={onPassClick}
            >
                <p>Password</p>
                <FiCopy size={16} />
            </div>


            {/* Share screen btn */}
            {/*<div*/}
            {/*    className={`${styles.icon} ${screen ? styles.disabled__icon : ""}`}*/}
            {/*    data-tip={`${(screen ? "Stop" : "")} Share Screen`}*/}
            {/*    onClick={onShareScreenClick}*/}
            {/*    aria-disabled={screen}*/}
            {/*>*/}
            {/*    <FontAwesomeIcon icon={faDesktop} />*/}
            {/*</div>*/}
        </div>
    );
};

export default ActionBar;
