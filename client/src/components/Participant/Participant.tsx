import React, {useEffect, useRef} from 'react';
import SimplePeer from "simple-peer";
import {FiMic, FiMicOff} from "react-icons/fi";
import styled from "styled-components";
import {toast} from "react-toastify";


/**
 * Prop-type alias for the component properties.
 */
type Properties = {
    peer?: SimplePeer.Instance,
    uid: string,
    isMuted: boolean,
    bstream?: MediaStream,
    isHidden: boolean,
    isUser: boolean,
    userRef?: React.RefObject<HTMLVideoElement>
};

/* contains the video element and icon */
const MainContainer = styled.div`
    width: 100%;
    height: 100%;
    grid-template-rows: repeate(1, 1fr);
    grid-template-columns: repeat(1, 1fr);
    position: relative;
    align-items: center;
    justify-content: center;
    flex-direction: column;
`;

/* video element */
const StyledVideo = styled.video`
    border-radius: 5px;
    border: 1px solid white;
    width: 100%;
    height: 100%;
    position: relative;
    
`;

/* hidden video element */
const HiddenVideo = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 5px;
  background-color: black;
  border: 1px solid white;
  justify-content: center;
  align-items: center;
  display: flex;
`;

const Username = styled.p`
  color: white;
  font-size: 20px;
`

/**
 * @param isHidden true if the user has hidden their camera.
 * @param isMuted true if the user is muted.
 * @param peer representing the participant.
 * @param uid ID of the participant.
 * @param isUser true if the participant is the user.
 * @param bstream user stream.
 * @param userRef reference to the video element, provided for current user.
 * @constructor
 */
const Participant = ({isHidden, isMuted, isUser, bstream, peer, userRef, uid}: Properties) => {
    const ref = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (bstream) {
            navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            }).then(stream => {
                if (ref.current) {
                    ref.current.srcObject = stream;
                }
            });
        }
    }, [])

    useEffect(() => {


        if (peer && !userRef) {
            peer.on('stream', (stream) => {
                if (ref.current) {
                    ref.current.srcObject = stream;
                }
            });
        }
    }, [uid, peer, ref, userRef]);

    return (
        <MainContainer>
            {
                isMuted
                    ? (<FiMicOff color={"#ea4335"} size={14} style={{
                        position: "absolute",
                        top: 10,
                        left: 10
                    }} />)
                    : (<FiMic color={"#fff"} size={14} style={{
                        position: "absolute",
                        top: 10,
                        left: 10
                    }} />)
            }
            {
                isHidden
                    ? (<HiddenVideo><Username>{isUser ? "(You)" : uid}</Username></HiddenVideo>)
                    : (<StyledVideo autoPlay playsInline ref={userRef ?? ref} />)
            }
        </MainContainer>
    );
}

export default Participant;
