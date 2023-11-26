import React, {useEffect, useState} from 'react';
import {
    Title,
    BodyContainer,
    MainContainer,
    HighlightedText,
    NormalText,
    ButtonContainer,
    SubmitButton
} from './common';
import {useLocation, useNavigate} from "react-router-dom";
import {ScreenComponents} from "../../components";
import {Http, Emitter, LocalStorage} from "../../services";
import {toast} from "react-toastify";

/**
 * Type alias for the prop-type of the screen.
 */
type Properties = {
    setShowNavBar: React.Dispatch<React.SetStateAction<boolean>>
};

/**
 * @param setShowNavBar setter for the navbar visibility.
 * @constructor
 */
const ConferenceInfoScreen = ({setShowNavBar}: Properties) => {
    /* session password */
    const [pass, setPass] = useState<string>("");
    const [isBadPass, setIsBadPass] = useState(false);
    const location = useLocation();
    const navigation = useNavigate();

    useEffect(() => {
        setShowNavBar(true);

        const user = LocalStorage.getUser();

        if (user && user.currentRoom) {
            Emitter.leaveSession((res) => {
                if (res.response === Http.OK) {
                    toast.success("Left the conference room", {
                        toastId: 'leftConf',
                    });
                } else {
                    toast.error("Couldn't leave conference room", {
                        toastId: 'leftConfFail',
                    });
                }

                /* remove credentials either way */
                user.currentRoom = undefined;
                LocalStorage.setUser(user);
            });
        }
    }, [location.pathname, setShowNavBar]);
    
    return (
        <MainContainer>
            <Title>
                Peer-to-Peer Call
    </Title>
    <BodyContainer>
    <NormalText>
        Our advanced <HighlightedText>peer-to-peer</HighlightedText> video call feature,
    powered by <HighlightedText>WebRTC</HighlightedText> technology, guarantees fast,
    efficient, secure, and private video calls.
        By utilizing out signaling server, PipeX establishes a
    direct communication channel between peers,
        ensuring crystal-clear <HighlightedText>real-time video </HighlightedText>
    communication across geographic boundaries
    while also protecting your privacy.
    </NormalText>
        <ButtonContainer>
            <ScreenComponents.PasswordInput
                value={pass}
                isErr={isBadPass}
                setIsErr={setIsBadPass}
                placeholder={"Session password"}
                onChange={e => {
                    setPass(e.target.value);
                }} />
            <SubmitButton onClick={() => {
                if (pass.length === 0) {
                    setIsBadPass(true);
                    return;
                }

                Emitter.createSession(pass, false, (res) => {
                    if (res.response === Http.OK) {
                        navigation("/conference/true/true", {
                            state: {
                                sessionId: res.result,
                                create: true,
                                sessionPassword: pass
                            }
                        });
                    } else {
                        toast.error("Couldn't create session", {
                            toastId: 'noSession',
                        });
                    }
                });
            }}>
                Create Session
            </SubmitButton>
        </ButtonContainer>
    </BodyContainer>
    </MainContainer>
);
};

export default ConferenceInfoScreen;
