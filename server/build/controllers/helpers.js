"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.handleBadListener = exports.handleBadRes = void 0;
const services_1 = require("../services");
const Http_1 = __importDefault(require("./Http"));
/**
 * @param res HTTP response instance to return
 * @param response response code from service function
 * @param err error from service function
 * @returns appropriate HTTP response code with the error message in the body, if needed.
 */
function handleBadRes(res, response, err) {
    switch (response) {
        case services_1.ServiceResponse.INVALID_IN:
            return res.status(Http_1.default.BAD).json({ err: err });
        case services_1.ServiceResponse.ALREADY_EXISTS:
            return res.status(Http_1.default.ALREADY_EXISTS).json({ err: err });
        case services_1.ServiceResponse.INTERNAL:
            return res.status(Http_1.default.INTERNAL).json({ err: err });
        case services_1.ServiceResponse.NOT_EXIST:
            return res.status(Http_1.default.NOT_FOUND).json({ err: err });
        default:
            return res.status(Http_1.default.INTERNAL).json({ err: err });
    }
}
exports.handleBadRes = handleBadRes;
/**
 * @param response response code from service function
 * @param err error from service function
 * @returns appropriate HTTP response code with the error message in the body, if needed.
 */
function handleBadListener(response, err) {
    switch (response) {
        case services_1.ServiceResponse.INVALID_IN:
            return {
                response: Http_1.default.BAD,
                err: err
            };
        case services_1.ServiceResponse.ALREADY_EXISTS:
            return {
                response: Http_1.default.ALREADY_EXISTS,
                err: err
            };
        case services_1.ServiceResponse.INTERNAL:
            return {
                response: Http_1.default.INTERNAL,
                err: err
            };
        case services_1.ServiceResponse.NOT_EXIST:
            return {
                response: Http_1.default.NOT_FOUND,
                err: err
            };
        default:
            return {
                response: Http_1.default.INTERNAL,
                err: err
            };
    }
}
exports.handleBadListener = handleBadListener;
/**
 * @param req HTTP request
 * @param res HTTP response
 * @param callback called if the token is valid
 * @param isAdmin if true indicates that the calling controller requires
 *        admin privileges.
 * @returns response of the callback or a bad response if the token
 *          is invalid.
 */
function verifyToken(req, res, callback, isAdmin) {
    return __awaiter(this, void 0, void 0, function* () {
        /* JWT token */
        let token = req.headers.authorization;
        /* check for missing data */
        if (!token) {
            return res.status(Http_1.default.UNAUTHORIZED).json({ err: "Missing token" });
        }
        // /* extract actual token (if using Bearer) */
        // token = token.split(' ')[1];
        /* container for the token user */
        const tokenUser = { uid: null };
        /* verify token */
        yield services_1.UserService.verifyToken(token, tokenUser);
        /* check if token is invalid */
        if (!tokenUser.uid) {
            return res.status(Http_1.default.UNAUTHORIZED).json({ err: "Invalid token" });
        }
        /* get user */
        const temp = yield services_1.UserService.getUser(tokenUser.uid);
        /* check for failure */
        if (temp.response !== services_1.ServiceResponse.SUCCESS) {
            return handleBadRes(res, temp.response, temp.err);
        }
        /* extract user */
        const user = temp.result;
        /* check if user is an admin and not banned */
        if (user.isBanned || (isAdmin && !user.isAdmin)) {
            return res.status(Http_1.default.UNAUTHORIZED).json({ err: "Not an admin" });
        }
        return callback(temp.result);
    });
}
exports.verifyToken = verifyToken;
