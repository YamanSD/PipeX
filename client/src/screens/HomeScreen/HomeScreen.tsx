import React, {useEffect, useRef, useState} from 'react';
import {ScreenComponents} from "../../components";
import {useLocation, useNavigate, useParams} from "react-router-dom";
import {Emitter, Http, LocalStorage} from '../../services';
import {toast} from "react-toastify";


const {
    PasswordInput,
    BoldLink,
    ButtonContainer,
    Input,
    LineText,
    MainContainer,
    SubmitButton
} = ScreenComponents;

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
const HomeScreen = ({setShowNavBar}: Properties) => {
    const [session, setSession] = useState("");
    const [password, setPassword] = useState("");
    const [badParams, setBadParams] = useState(false);
    const navigation = useNavigate();
    const location = useLocation();
    const hasPassed = useRef(true);
    const {invalid} = useParams();

    useEffect(() => {
        if (invalid === 'true') {
            toast.warning(`Invalid Destination`, {
                toastId: 'warningDest',
            });
        }

    }, [invalid]);

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
                    toast.success("Left the session", {
                        toastId: 'leftSucc2',
                    });
                } else {
                    toast.error(`${res.err}`, {
                        toastId: 'err2',
                    });
                }

                /* remove credentials either way */
                user.currentRoom = undefined;
                LocalStorage.setUser(user);
            });
        }
    }, [location.pathname, setShowNavBar]);

    const onJoin = () => {
        const myPeer = Emitter.refreshPeer();
        const user = LocalStorage.getUser();

        if (!user) {
            toast.warn("No user");
            return;
        }

        myPeer.on('open', () => {
            Emitter.joinSession(session, password, (res) => {
                const data = res.result;

                if (res.response === Http.OK && data) {
                    if (data.isChat) {
                        navigation(`/webchat`, {
                            state: {
                                sessionId: session,
                                sessionPassword: password,
                                creator: data.creator,
                                initUsers: data.users
                            }
                        });
                    } else {
                        navigation(`/conference`, {
                            state: {
                                sessionId: session,
                                sessionPassword: password,
                                creator: data.creator,
                                initUsers: data.users
                            }
                        });
                    }

                    setSession("");
                    setPassword("");
                } else {
                    setBadParams(true);
                    toast.error(`${JSON.stringify(res.err)}`, {
                        toastId: "err3"
                    });
                }
            });
        });
    };

    return (
        <MainContainer>
            <Input
                errMsg={"Invalid room parameters"}
                isErr={badParams}
                setIsErr={setBadParams}
                value={session}
                placeholder={"Meeting ID"}
                onChange={e => setSession(e.target.value)}
            />
            <PasswordInput
                errMsg={"Invalid room parameters"}
                isErr={badParams}
                setIsErr={setBadParams}
                value={password}
                placeholder={"Session password"}
                onChange={e => setPassword(e.target.value)}  />
            <ButtonContainer>
                <SubmitButton onClick={onJoin}>
                    Join
                </SubmitButton>
                <LineText>
                    If you're the meeting host, <BoldLink onClick={() => {
                        navigation("/confInfo")
                }}>create</BoldLink>
                </LineText>
            </ButtonContainer>
        </MainContainer>
    );
}

export default HomeScreen;
