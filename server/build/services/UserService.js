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
exports.verifyToken = exports.generateToken = exports.superUser = exports.setBanUser = exports.deleteUser = exports.getAllUsers = exports.getUser = exports.updateUser = exports.createUser = void 0;
/**
 * Provides CRUD operations for the User table.
 */
const model_1 = require("../model");
const Response_1 = __importDefault(require("./Response"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const helpers_1 = require("./helpers");
require("dotenv/config");
/**
 * @param email email of the user
 * @param password password of the user
 * @param admin if true the user is an admin
 * @returns if successful, new User is returned.
 *          Otherwise, reason of error & error.
 */
function createUser(email, password, admin) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return {
                result: yield model_1.User.create({
                    user_email: email,
                    user_password: password,
                    is_admin: admin
                }),
                response: Response_1.default.SUCCESS
            };
        }
        catch (e) {
            return (0, helpers_1.handleError)(e);
        }
    });
}
exports.createUser = createUser;
/**
 * @param user modified user, saved to database.
 */
function updateUser(user) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield user.save();
            return {
                response: Response_1.default.SUCCESS
            };
        }
        catch (e) {
            return (0, helpers_1.handleError)(e);
        }
    });
}
exports.updateUser = updateUser;
/**
 * @param identifier of the user
 * @returns the user belonging to the identifier
 */
function getUser(identifier) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            /* holds user value */
            let user;
            if (typeof identifier === 'string') {
                user = yield model_1.User.findOne({
                    where: {
                        user_email: identifier.toLowerCase()
                    }
                });
            }
            else {
                user = yield model_1.User.findByPk(identifier);
            }
            if (!user) {
                if (identifier === process.env.SU_EMAIL) {
                    /* create superuser */
                    const temp = yield superUser();
                    if (temp.response === Response_1.default.SUCCESS) {
                        return getUser(identifier); // Retry after creation
                    }
                    /* internal error for some reason */
                    return {
                        response: Response_1.default.INTERNAL,
                        err: temp.err
                    };
                }
                return {
                    response: Response_1.default.NOT_EXIST
                };
            }
            return {
                response: Response_1.default.SUCCESS,
                result: user
            };
        }
        catch (e) {
            return (0, helpers_1.handleError)(e);
        }
    });
}
exports.getUser = getUser;
/**
 * @returns all users
 */
function getAllUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return {
                response: Response_1.default.SUCCESS,
                result: yield model_1.User.findAll()
            };
        }
        catch (e) {
            return (0, helpers_1.handleError)(e);
        }
    });
}
exports.getAllUsers = getAllUsers;
/**
 * @param email of the user to be deleted
 */
function deleteUser(email) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            /* make sure nobody deletes the superuser */
            if (email === process.env.SU_EMAIL) {
                return {
                    response: Response_1.default.INVALID_IN,
                    err: "Super cannot be deleted"
                };
            }
            const user = (yield getUser(email)).result;
            if (!user) {
                return {
                    response: Response_1.default.NOT_EXIST
                };
            }
            yield user.destroy();
            return {
                response: Response_1.default.SUCCESS
            };
        }
        catch (e) {
            return (0, helpers_1.handleError)(e);
        }
    });
}
exports.deleteUser = deleteUser;
/**
 * @param email of the user to be banned\
 * @param status of the user (true banned, false unbanned)
 */
function setBanUser(email, status) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = (yield getUser(email)).result;
            if (!user) {
                return {
                    response: Response_1.default.NOT_EXIST
                };
            }
            user.setStatus(status);
            yield updateUser(user);
            return {
                response: Response_1.default.SUCCESS
            };
        }
        catch (e) {
            return (0, helpers_1.handleError)(e);
        }
    });
}
exports.setBanUser = setBanUser;
/**
 * Creates superuser if it does not exist
 * @returns the superuser
 */
function superUser() {
    return __awaiter(this, void 0, void 0, function* () {
        const suEmail = process.env.SU_EMAIL;
        const suPass = process.env.SU_PASS;
        let response = yield getUser(suEmail);
        /* check if user exists */
        if (response.response === Response_1.default.SUCCESS) {
            return {
                response: Response_1.default.SUCCESS,
                result: response.result
            };
        }
        /* create superuser */
        response = yield createUser(suEmail, suPass, true);
        /* check if creation failed */
        if (response.response !== Response_1.default.SUCCESS) {
            return {
                response: Response_1.default.INTERNAL,
                err: response.err
            };
        }
        return {
            response: Response_1.default.SUCCESS,
            result: response.result
        };
    });
}
exports.superUser = superUser;
/**
 * @param email of the user
 * @param password of the user
 * @returns true if the user is genuine.
 */
function authenticate(email, password) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = (yield getUser(email)).result;
            if (!user) {
                return {
                    response: Response_1.default.NOT_EXIST
                };
            }
            return {
                result: !user.isBanned && user.isValidPassword(password),
                response: Response_1.default.SUCCESS
            };
        }
        catch (e) {
            return (0, helpers_1.handleError)(e);
        }
    });
}
/**
 * @param email of the user
 * @param password of the user
 * @returns a JWT token if the email-password pair are valid.
 *          Otherwise, undefined.
 */
function generateToken(email, password) {
    return __awaiter(this, void 0, void 0, function* () {
        /* in case the user provided an upper case email */
        email = email.toLowerCase();
        const authResponse = yield authenticate(email, password);
        if (authResponse.response === Response_1.default.SUCCESS && authResponse.result) {
            return jsonwebtoken_1.default.sign({ email }, // PayloadType
            process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRY
            });
        }
        else {
            return null;
        }
    });
}
exports.generateToken = generateToken;
/**
 * @param token JWT token to be verified
 * @param container result returned to this container
 * @returns the user (owner of token) ID if the token is valid.
 *          Otherwise, undefined.
 */
function verifyToken(token, container) {
    return __awaiter(this, void 0, void 0, function* () {
        /* note that we can provide fine-grained control of reasons of error */
        return new Promise((resolve) => {
            jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err, user) => {
                /* this is the actual form of the response */
                user = user;
                /* either we have an error, empty response, no email, or expired */
                if (err || !user || !user.email || !user.exp || user.exp <= 0) {
                    container.uid = null;
                    resolve();
                    return;
                }
                container.uid = user.email;
                resolve();
            });
        });
    });
}
exports.verifyToken = verifyToken;
