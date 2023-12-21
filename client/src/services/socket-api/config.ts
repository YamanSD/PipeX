import Http from "../Http";

const config = {
    server: "https://192.168.0.105:8085",
    peerServer: "/",
    peerPort: 8086,
    apiParent: "api",
};

/**
 * Type alias for callback functions used by the emitter.
 */
export type EmitterCallback<T = any> = (res: {
    response: Http,
    err?: unknown,
    result?: T
}) => any;

/**
 * Type alias for callback function used by listeners.
 */
export type ListenerCallback<T = any> = (res: T) => any;


export default config;
