"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const services_1 = require("../services");
/**
 * @param socket socket.io socket to verify.
 * @param next callback for the next controller.
 * @constructor
 */
function TokenValidator(socket, next) {
    const token = socket.handshake.query.token;
    if (!token) {
        return next(new Error(`Invalid token`));
    }
    const container = { uid: null };
    services_1.UserService.verifyToken(token, container).then(() => {
        if (container.uid === null) {
            return next(new Error(`Invalid token`));
        }
        return next();
    });
}
exports.default = TokenValidator;
