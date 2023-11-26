import { createContext } from "react";

const Context = createContext<{
    switchToSignIn: () => any,
    switchToSignUp: () => any,
    setIsLoggedIn: (v: boolean) => any,
}>({
    switchToSignIn: () => {},
    switchToSignUp: () => {},
    setIsLoggedIn: () => {}
});

export default Context;
