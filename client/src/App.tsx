import React, {useEffect, useRef, useState} from 'react';
import "@fontsource/poppins"; // Defaults to weight 400
import "@fontsource/poppins/400-italic.css"; // Specify weight and style
import {BrowserRouter, Link, Route, Routes, Navigate} from "react-router-dom";
import {FiLogOut, FiHome, FiUser, FiVideo, FiMessageSquare, FiAlertCircle} from "react-icons/fi";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import {
    addParticipant,
    Listener,
    LocalStorage,
    removeParticipant, RootState,
    setUser,
    updateParticipant,
    UserType
} from './services';
import {AuthBox, Component} from "./components";
import { Navbar, Nav } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';
import './App.css';
import {
    ConferenceInfoScreen,
    ConferenceScreen,
    WebChatInfoScreen,
    HomeScreen, ChatRoom
} from "./screens";
import axios from "axios";
import {connect} from "react-redux";


/**
 * Type alias for the property type of the App.
 */
type Properties = {
    stream: MediaStream,
    user: UserType,
    setMainStream: (stream: MediaStream) => any,
    addParticipant: (user: UserType) => any,
    setUser: (user: UserType) => any,
    removeParticipant: (uid: string) => any,
    updateParticipant: (user: UserType) => any,
};

function App(props: Properties) {
    useEffect(() => {
        window.process = {
            ...window.process,
            // keep as is, this is an issue with peer-rtc
            nextTick: function() {
                return null;
            }
        };
    }, []);

    useEffect(() => {
        axios.interceptors.response.use(function (response) {
            // Any status code that lie within the range of 2xx
            return response;
        }, function (error) {
            // Any status codes that falls outside the range of 2xx cause this function to trigger
            toast.error(`${error.toString()}, check server`, {
                position: toast.POSITION.TOP_RIGHT,
                toastId: "serverErr",
                theme: "light",
                autoClose: false,
                icon: <FiAlertCircle color={"#f00"} />
            });
            return error;
        });
    }, []);

    const [isLoggedIn, setIsLoggedIn] = useState(LocalStorage.getUser() !== null);
    const [showNavBar, setShowNavBar] = useState(true);

    useEffect(() => {
        if (!isLoggedIn) {
            LocalStorage.clear();
        } else {
            props.setUser(LocalStorage.getUser() as any)
        }
    }, [isLoggedIn]);

    useEffect(() => {
        setShowNavBar(true);
    }, []);

    return (
      <BrowserRouter>
        <div className="App">
            {
                showNavBar
                &&
                isLoggedIn
                &&
                <Navbar className={"nav__bar"} appearance={"inverse"}>
                    <Navbar.Brand as={Link} to={"/"}>PipeX</Navbar.Brand>
                    <Nav>
                        <Nav.Item as={Link} to={"/"} icon={<FiHome />}>
                            Home
                        </Nav.Item>
                        <Nav.Item as={Link} to={"/confInfo"} icon={<FiVideo />}>
                            Conference
                        </Nav.Item>
                        <Nav.Item as={Link} to={"/webChatInfo"} icon={<FiMessageSquare />}>
                            WebChat
                        </Nav.Item>
                    </Nav>
                    <Nav pullRight>
                        <Nav.Menu title="Options">
                            <Nav.Item className={"option"} as={Link} to={"/users"} icon={<FiUser />}>Profile</Nav.Item>
                            <Nav.Item className={"option"} as={Link} to={"/"} onClick={() => {
                                LocalStorage.clear();
                                setIsLoggedIn(false);
                            }} icon={<FiLogOut />}>Logout</Nav.Item>
                        </Nav.Menu>
                    </Nav>
                </Navbar>
            }
            <div>
                <Routes>
                    {isLoggedIn ? (
                        <>
                            <Route path="*" element={<Navigate to={`/home/true`} replace={true} />} />
                            <Route path={"/confInfo"} element={<ConferenceInfoScreen setShowNavBar={setShowNavBar} />} />
                            <Route path={"/webChatInfo"} element={<WebChatInfoScreen setShowNavBar={setShowNavBar} />} />
                            <Route path={"/conference"} element={<ConferenceScreen setShowNavBar={setShowNavBar} />} />
                            <Route path={"/home/:invalid?"} element={<HomeScreen setShowNavBar={setShowNavBar} />} />
                            <Route path={"/"} element={<Navigate to={`/home`} replace={true} />} />
                            <Route path={"/webchat"} element={<ChatRoom setShowNavBar={setShowNavBar} />} />
                        </>
                    ) : (
                        <>
                            <Route path="*" element={<Navigate to={`/home`} replace={true} />} />
                            <Route path={"/"} element={<Navigate to={`/home`} replace={true} />} />
                            <Route path="/home/:invalid?" element={<AuthBox setIsLoggedIn={setIsLoggedIn} />} />
                        </>
                    )}
                </Routes>
            </div>
            {
                showNavBar ? <div className={"bar"} /> : null
            }
        </div>
      </BrowserRouter>
    );
}

/**
 * @param state
 */
const mapStateToProps = (state: RootState) => {
    return  {
        stream: state.user.mainStream,
        user: state.user.currentUser
    };
};

/**
 * @param dispatch
 */
const mapDispatchToProps = (dispatch: (...arg: any[]) => any) => {
    return {
        addParticipant: (user: UserType) => dispatch(addParticipant(user)),
        setUser: (user: UserType) => dispatch(setUser(user)),
        removeParticipant: (uid: string) => dispatch(removeParticipant(uid)),
        updateParticipant: (user: UserType) => dispatch(updateParticipant(user)),
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(App) as Component;
