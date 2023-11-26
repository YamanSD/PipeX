import React, {useContext, useEffect, useState} from "react";
import {
    BoldLink,
    BoxContainer,
    FormContainer,
    Input,
    LineText, PasswordInput,
    SubmitButton,
} from "./common";
import { Separator } from "../index";
import { useNavigate } from "react-router-dom";
import Context from './Context';
import {Http, ApiGateway, LocalStorage} from "../../services";
import validator from "validator";

export function SignupForm() {
    const { switchToSignIn, setIsLoggedIn } = useContext(Context);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confPassword, setConfPassword] = useState("");
    const [isBadEmail, setIsBadEmail] = useState(false);
    const [isBadPass, setIsBadPass] = useState(false);
    const navigation = useNavigate();

    useEffect(() => {
        if (email.length === 0) {
            return;
        }

        setIsBadEmail(!validator.isEmail(email));
    }, [email]);

    const signupReq = () => {
        if (password !== confPassword) {
            setIsBadPass(true);
            return;
        }

        ApiGateway.Post(`users/register`, {
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
                setIsBadEmail(true);
            }
        });
    };

    return (
        <BoxContainer>
            <FormContainer>
                <Input
                    errMsg={"Invalid email or already in use"}
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
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password"
                />
                <PasswordInput
                    isErr={isBadPass}
                    setIsErr={setIsBadPass}
                    value={confPassword}
                    onChange={e => setConfPassword(e.target.value)}
                    placeholder="Confirm password"
                />
            </FormContainer>
            <Separator vertical margin={"10px"} />
            <SubmitButton type="submit" onClick={signupReq}>Signup</SubmitButton>
            <Separator vertical margin={"5px"} />
            <LineText>
                Already have an account?{"  "}
                <BoldLink onClick={switchToSignIn} href="#">
                    login
                </BoldLink>
            </LineText>
        </BoxContainer>
    );
}