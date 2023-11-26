import React, {useEffect, useState} from 'react';
import "@fontsource/poppins"; // Defaults to weight 400
import "@fontsource/poppins/400-italic.css"; // Specify weight and style
import {BrowserRouter, Link, Route, Routes, Navigate} from "react-router-dom";
import {FiLogOut, FiHome, FiUser, FiVideo, FiMessageSquare, FiAlertCircle} from "react-icons/fi";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import {Listener, LocalStorage} from './services';
import { AuthBox } from "./components";
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


function App() {
    useEffect(() => {
        window.process = {
            ...window.process,
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
            Listener.onMsg((m) => {
                console.log(m);
            });
        }
    }, [isLoggedIn]);

    useEffect(() => {
        setShowNavBar(true);
    }, []);

    useEffect(() => {
        // For testing
        const t = LocalStorage.getUser();
        console.log(t);
        if (!t){
            return;
        }
        t.currentRoom = undefined;
        LocalStorage.setUser(t);
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
                            <Route path={"/conference/:initMic/:initCam"} element={<ConferenceScreen setShowNavBar={setShowNavBar} />} />
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

export default App;
