import React, {useEffect, useState} from 'react';
import styled from 'styled-components';
import LoginForm from './LoginForm';
import { SignupForm } from './SignupForm';
import { motion } from 'framer-motion';
import {mainColor, mainColor_1, secondaryColor} from "./common";
import Context from './Context';
import {useParams} from "react-router-dom";
import {toast} from "react-toastify";
import {FiAlertTriangle} from "react-icons/fi";

const BoxContainer = styled.div`
  justify-content: space-between;
  width: 350px;
  height: 580px;
  display: flex;
  margin: 25px;
  flex-direction: column;
  border-radius: 19px;
  background-color: ${secondaryColor};
  box-shadow: 0 2px 5px rgba(255, 255, 255, 0.3);
  position: relative;
  overflow: hidden;
`;

const TopContainer = styled.div`
  width: 100%;
  height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  margin-top: 50px;
  padding: 0 29px 80px;
`;

const BackDrop = styled(motion.div)`
  position: absolute;
  width: 160%;
  height: 550px;
  display: flex;
  flex-direction: column;
  border-radius: 50%;
  top: -290px;
  left: -70px;
  transform: rotate(60deg);
  background: linear-gradient(
    58deg, ${mainColor_1} 20%, ${mainColor} 100%
  );
`;

const HeaderContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const HeaderText = styled.div`
  font-size: 30px;
  font-weight: 600;
  line-height: 1.24;
  color: #fff;
  z-index: 10;
`;

const SmallText = styled.div`
  font-size: 11px;
  font-weight: 500;
  color: #fff;
  margin-top: 7px;
  z-index: 10;
`;

const InnerContainer = styled.div`
  margin-top: auto;
  display: flex;
  flex-direction: column;
  padding: 0 20px;
`;

const backdropVariants = {
    expanded: {
        width: "233%",
        height: "1050px",
        borderRadius: "20%",
        transform: "rotate(60deg)"
    },
    collapsed: {
        width: "160%",
        height: "550px",
        borderRadius: "50%",
        transform: "rotate(60deg)"
    }
}

const expandingTransition = {
    type: "spring",
    duration: 2.3,
    stiffness: 30,
}

/**
 * Type alias for the prop-type of the component.
 */
type Properties = {
    setIsLoggedIn: (value: boolean) => any;
};

/**
 * @param setIsLoggedIn changes user status.
 * @constructor
 */
const AuthBox = ({setIsLoggedIn}: Properties) => {
    const [isExpanded, setExpanded] = useState(false);
    const [active, setActive] = useState('signin');
    const {invalid} = useParams();

    useEffect(() => {
        if (invalid === 'true') {
            toast.warning(`Invalid Destination`, {
                position: toast.POSITION.TOP_RIGHT,
                toastId: "InvalidDest2",
                theme: "light",
                icon: <FiAlertTriangle />
            });
        }

    }, [invalid]);

    const playExpandingAnimation = () => {
        setExpanded(true);
        setTimeout(() => {
            setExpanded(false);
        }, expandingTransition.duration * 1000 - 1500);
    }

    const switchToSignUp = () => {
        playExpandingAnimation();
        setTimeout(() => {
            setActive("signup");
        }, 400);
    }

    const switchToSignIn = () => {
        playExpandingAnimation();
        setTimeout(() => {
            setActive("signin");
        }, 400);
    }

    const contextValue = {switchToSignUp, switchToSignIn, setIsLoggedIn};

    return (
        <Context.Provider value={contextValue}>
            <BoxContainer>
                <TopContainer>
                    <BackDrop
                        initial={false}
                        animate={isExpanded ? "expanded" : "collapsed"}
                        variants={backdropVariants}
                        transition={expandingTransition}
                    />
                    {active === "signin" && <HeaderContainer>
                        <HeaderText>Welcome</HeaderText>
                        <HeaderText>Back</HeaderText>
                        <SmallText>Please sign-in to continue!</SmallText>
                    </HeaderContainer>}
                    {active === "signup" && <HeaderContainer>
                        <HeaderText>Create</HeaderText>
                        <HeaderText>Account</HeaderText>
                        <SmallText>Please sign-up to continue!</SmallText>
                    </HeaderContainer>}
                </TopContainer>
                <InnerContainer>
                    {active === "signin" && <LoginForm />}
                    {active === "signup" && <SignupForm />}
                </InnerContainer>
            </BoxContainer>
        </Context.Provider>
    );
};

export default AuthBox;