import React, {useContext, useEffect, useState} from "react";
import {
    BoldLink,
    BoxContainer,
    FormContainer,
    Input,
    LineText, PasswordInput,
    SubmitButton,
} from "./common";
import { useNavigate } from "react-router-dom";
import { Separator } from "../index";
import Context from './Context';
import {Http, ApiGateway, LocalStorage} from "../../services";
import validator from 'validator';

/**
 * Login form component, used by user to login.
 * @constructor
 */
const LoginForm = () => {
    const { switchToSignUp, setIsLoggedIn } = useContext(Context);
    const [email, setEmail] = useState("");
    const [isBadEmail, setIsBadEmail] = useState(false);
    const [password, setPassword] = useState("");
    const [isBadPass, setIsBadPass] = useState(false);
    const navigation = useNavigate();

    useEffect(() => {
        if (email.length === 0) {
            return;
        }

        setIsBadEmail(!validator.isEmail(email));
    }, [email, setIsBadEmail]);

    const loginReq = () => {
        let err = false;

        if (!validator.isEmail(email)) {
            setIsBadEmail(true);
            err = true;
        }

        if (password.length === 0) {
            setIsBadPass(true);
            err = true;
        }

        if (err) {
            return;
        }

        ApiGateway.Post(`users/authenticate`, {
            email: email,
            password: password,
        }).then(res => {
            if (res.status === Http.OK) {
                LocalStorage.setUser({
                    uid: email,
                    currentRoom: undefined,
                    isConnected: true,
                    token: res.data.token
                });
                setEmail("");
                setPassword("");
                setIsLoggedIn(true);
                navigation("/");
            } else {
                setIsBadPass(true);
            }
        });
    };

    return (
        <BoxContainer>
            <FormContainer>
                <Input
                    errMsg={"Invalid email"}
                    isErr={isBadEmail}
                    setIsErr={setIsBadEmail}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                />
                <PasswordInput
                    isErr={isBadPass}
                    setIsErr={setIsBadPass}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                />
            </FormContainer>
            <Separator vertical margin="1.6em" />
            <SubmitButton type="submit" onClick={loginReq}>Login</SubmitButton>
            <Separator vertical margin="5px" />
            <LineText>
                Don't have an account?{"  "}
                <BoldLink onClick={switchToSignUp} href="#">
                    Signup
                </BoldLink>
            </LineText>
        </BoxContainer>
    );
};

export default LoginForm;
