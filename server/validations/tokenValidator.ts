import {Socket} from "socket.io";
import {UserService} from '../services';
import {ExtendedError} from "socket.io/dist/namespace";

/**
 * @param socket socket.io socket to verify.
 * @param next callback for the next controller.
 * @constructor
 */
export default function TokenValidator(socket: Socket, next: (err?: ExtendedError) => void): void {
    const token = socket.handshake.query.token as string;

    if (!token) {
        return next(new Error(`Invalid token`));
    }

    const container: { uid: string | null } = { uid: null };

    UserService.verifyToken(token, container).then(() => {
        if (container.uid === null) {
            return next(new Error(`Invalid token`));
        }

        return next();
    });
}
