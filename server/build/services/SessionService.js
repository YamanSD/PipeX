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
exports.updateSession = exports.verifySession = exports.getUserSessions = exports.getSession = exports.createSession = void 0;
/**
 * Provides CRUD operations for the Session table.
 */
const model_1 = require("../model");
const Response_1 = __importDefault(require("./Response"));
const helpers_1 = require("./helpers");
require("dotenv/config");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const UserService_1 = require("./UserService");
/**
 * @param session to generate token for.
 * @returns session token, used by users to access the session.
 *          Users view this token as the ID.
 */
function generateToken(session) {
    return jsonwebtoken_1.default.sign({
        id: session.sessionId,
        password: session.password
    }, process.env.JWT_S_SECRET, {
        expiresIn: process.env.JWT_S_EXPIRY
    });
}
/**
 * @param token JWT token to be verified
 * @param container result returned to this container
 * @returns the session ID and password if the token is valid.
 *          Otherwise, undefined.
 */
function verifyToken(token, container) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => {
            jsonwebtoken_1.default.verify(token, process.env.JWT_S_SECRET, (err, session) => {
                session = session;
                /* either we have an error, empty response, no id, no password, or expired */
                if (err || !session || !session.id || !session.password
                    || !session.exp || session.exp <= 0) {
                    container.sessionId = null;
                    container.password = null;
                    resolve();
                    return;
                }
                container.sessionId = session.id;
                container.password = session.password;
                resolve();
            });
        });
    });
}
/**
 * @param creatorEmail of the user creating the session
 * @param password of the session
 * @param isChat true indicates chat only session
 * @returns the Session token if successful.
 */
function createSession(creatorEmail, password, isChat) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const creatorRes = yield (0, UserService_1.getUser)(creatorEmail);
            /* check for any errors */
            if (creatorRes.response !== Response_1.default.SUCCESS) {
                return {
                    response: creatorRes.response,
                    err: `${creatorRes.err} :user: ${creatorEmail}`
                };
            }
            /* get creator ID */
            const creatorId = creatorRes.result.uid;
            /* create session */
            const session = yield model_1.Session.create({
                session_creator: creatorId,
                session_password: password,
                is_chat: isChat
            });
            if (!session) {
                return {
                    response: Response_1.default.INVALID_IN,
                    err: "Could not create session"
                };
            }
            return {
                result: {
                    sessionToken: generateToken(session),
                    sessionId: session.sessionId
                },
                response: Response_1.default.SUCCESS
            };
        }
        catch (e) {
            return (0, helpers_1.handleError)(e);
        }
    });
}
exports.createSession = createSession;
/**
 * @param sessionId ID of the session to get.
 * @returns the session belonging to the ID.
 */
function getSession(sessionId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const session = yield model_1.Session.findByPk(sessionId);
            if (!session) {
                /* does not exist */
                return {
                    response: Response_1.default.NOT_EXIST
                };
            }
            return {
                response: Response_1.default.SUCCESS,
                result: session
            };
        }
        catch (e) {
            return (0, helpers_1.handleError)(e);
        }
    });
}
exports.getSession = getSession;
/**
 * @param uid to get sessions for.
 * @returns a list of session IDs of the user.
 */
function getUserSessions(uid) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const sessions = yield model_1.Session.findAll({
                where: {
                    session_creator: uid
                },
                attributes: ['session_id']
            });
            return {
                response: Response_1.default.SUCCESS,
                result: sessions.map(s => s.sessionId)
            };
        }
        catch (e) {
            return (0, helpers_1.handleError)(e);
        }
    });
}
exports.getUserSessions = getUserSessions;
/**
 * @param token session token to verify.
 * @returns the session belonging to the token if valid
 */
function verifySession(token) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let container = { sessionId: null, password: null };
            yield verifyToken(token, container);
            /* check token parameters */
            if (container.sessionId === null || container.password === null) {
                return {
                    response: Response_1.default.INVALID_IN,
                    err: "Invalid session ID"
                };
            }
            /* get session */
            const sessionRes = yield getSession(container.sessionId);
            /* check session */
            if (sessionRes.response !== Response_1.default.SUCCESS || sessionRes.result === undefined) {
                return {
                    response: sessionRes.response,
                    err: sessionRes.err
                };
            }
            /* session instance */
            const session = sessionRes.result;
            if (session.password !== container.password) {
                return {
                    response: Response_1.default.INVALID_IN,
                    err: "Invalid session password"
                };
            }
            return {
                response: Response_1.default.SUCCESS,
                result: session
            };
        }
        catch (e) {
            return (0, helpers_1.handleError)(e);
        }
    });
}
exports.verifySession = verifySession;
/**
 * @param session to be updated.
 * @returns response code.
 */
function updateSession(session) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield session.save();
            return {
                response: Response_1.default.SUCCESS,
            };
        }
        catch (e) {
            return (0, helpers_1.handleError)(e);
        }
    });
}
exports.updateSession = updateSession;
