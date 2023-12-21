import React, {useContext, useEffect, useRef, useState} from 'react';
import {
    BodyContainer,
    ButtonContainer,
    HighlightedText,
    MainContainer,
    NormalText,
    SubmitButton,
    Title
} from './common';
import {ScreenComponents} from "../../components";
import {useLocation, useNavigate} from "react-router-dom";
import {Emitter, Http, LocalStorage} from "../../services";
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
const WebChatInfoScreen = ({setShowNavBar}: Properties) => {
    /* session password */
    const [pass, setPass] = useState<string>("");
    const [isBadPass, setIsBadPass] = useState(false);
    const location = useLocation();
    const hasPassed = useRef(true);
    const navigation = useNavigate();

    useEffect(() => {
        if (hasPassed.current) {
            hasPassed.current = false;
        } else {
            return;
        }

        setShowNavBar(true);

        const user = LocalStorage.getUser();
        if (user && user.currentRoom) {
            Emitter.leaveSession((res) => {
                if (res.response === Http.OK) {
                    toast.success("Left the chat room", {
                        toastId: 'successLeave',
                    });
                } else {
                    toast.error("Couldn't leave chat room", {
                        toastId: 'failLeave',
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
                WebChat
            </Title>
            <BodyContainer>
                <NormalText>
                    Explore the power of our <HighlightedText>centralized</HighlightedText> chat feature,
                    bringing users together in a dynamic group environment. Whether you're collaborating on projects,
                    planning events, or sharing ideas,
                    PipeX's group chat ensures <HighlightedText>smooth and efficient</HighlightedText> interactions.
                    Harness the ability to send <HighlightedText>targeted messages</HighlightedText> to specific users,
                    fostering personalized and direct conversations in a chat session.
                    Your exchanges are <HighlightedText>securely logged</HighlightedText> in our database,
                    creating a comprehensive record for easy reference.
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

                        Emitter.createSession(pass, true, (res) => {
                            if (res.response === Http.OK) {
                                setPass("");

                                const user = LocalStorage.getUser();

                                if (!user) {
                                    toast.error("Invalid state", {
                                        toastId: 'err1',
                                    });
                                    return;
                                }

                                user.currentRoom = res.result;
                                LocalStorage.setUser(user);

                                navigation("/webchat", {state: {
                                    create: true, sessionId: res.result, sessionPassword: pass
                                }})
                            } else {
                                toast.error(`Couldn't create session! (${res.response})`, {
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

export default WebChatInfoScreen;
