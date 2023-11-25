import {ServiceResponse, UserService} from "../services";
import {Request, Response} from 'express';
import Http from "./Http";
import {User} from "../model";

/**
 * @param res HTTP response instance to return
 * @param response response code from service function
 * @param err error from service function
 * @returns appropriate HTTP response code with the error message in the body, if needed.
 */
export function handleBadRes(res: Response, response: ServiceResponse, err?: unknown): Response {
    switch (response) {
        case ServiceResponse.INVALID_IN:
            return res.status(Http.BAD).json({err: err});
        case ServiceResponse.ALREADY_EXISTS:
            return res.status(Http.ALREADY_EXISTS).json({err: err});
        case ServiceResponse.INTERNAL:
            return res.status(Http.INTERNAL).json({err: err});
        case ServiceResponse.NOT_EXIST:
            return res.status(Http.NOT_FOUND).json({err: err});
        default:
            return res.status(Http.INTERNAL).json({err: err});
    }
}

/**
 * Type alias for the handleBadListener function.
 */
type BadListen = {
    response: Http,
    err: unknown
};

/**
 * @param response response code from service function
 * @param err error from service function
 * @returns appropriate HTTP response code with the error message in the body, if needed.
 */
export function handleBadListener(response: ServiceResponse,
                                  err: unknown): BadListen {
    switch (response) {
        case ServiceResponse.INVALID_IN:
            return {
                response: Http.BAD,
                err: err
            };
        case ServiceResponse.ALREADY_EXISTS:
            return {
                response: Http.ALREADY_EXISTS,
                err: err
            };
        case ServiceResponse.INTERNAL:
            return {
                response: Http.INTERNAL,
                err: err
            };
        case ServiceResponse.NOT_EXIST:
            return {
                response: Http.NOT_FOUND,
                err: err
            };
        default:
            return {
                response: Http.INTERNAL,
                err: err
            };
    }
}

/**
 * Type alias for the callback function used in VerifyToken
 */
type Callback = (user: User) => Promise<Response> | Response;

/**
 * @param req HTTP request
 * @param res HTTP response
 * @param callback called if the token is valid
 * @param isAdmin if true indicates that the calling controller requires
 *        admin privileges.
 * @returns response of the callback or a bad response if the token
 *          is invalid.
 */
export async function verifyToken(req: Request,
                                  res: Response,
                                  callback: Callback,
                                  isAdmin?: boolean): Promise<Response> {
    /* JWT token */
    let token = req.headers.authorization;

    /* check for missing data */
    if (!token) {
        return res.status(Http.UNAUTHORIZED).json({err: "Missing token"});
    }

    // /* extract actual token (if using Bearer) */
    // token = token.split(' ')[1];

    /* container for the token user */
    const tokenUser: {uid: string | null} = { uid: null };

    /* verify token */
    await UserService.verifyToken(token, tokenUser);

    /* check if token is invalid */
    if (!tokenUser.uid) {
        return res.status(Http.UNAUTHORIZED).json({err: "Invalid token"});
    }

    /* get user */
    const temp = await UserService.getUser(tokenUser.uid);

    /* check for failure */
    if (temp.response !== ServiceResponse.SUCCESS) {
        return handleBadRes(res, temp.response, temp.err);
    }

    /* extract user */
    const user = temp.result as User;

    /* check if user is an admin and not banned */
    if (user.isBanned || (isAdmin && !user.isAdmin)) {
        return res.status(Http.UNAUTHORIZED).json({err: "Not an admin"});
    }

    return callback(temp.result as User);
}
