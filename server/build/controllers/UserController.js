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
exports.updateUser = exports.setBanUser = exports.deleteUser = exports.createUser = exports.register = exports.getUser = exports.getAllUsers = exports.authenticate = void 0;
const services_1 = require("../services");
const Http_1 = __importDefault(require("./Http"));
const helpers_1 = require("./helpers");
const UserService_1 = require("../services/UserService");
const express_validator_1 = require("express-validator");
/**
 * @param req HTTP request containing email & password in body
 * @param res HTTP response.
 * @return Either token in body, err reason, or undefined token if credentials are invalid.
 */
function authenticate(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        /* check for invalid data */
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(Http_1.default.BAD).json({ errs: errors });
        }
        const { email, password } = req.body;
        /* check for missing data */
        if (!email || !password) {
            return res.status(Http_1.default.BAD).json({ err: "Missing data" });
        }
        /* try to generate token */
        const result = yield services_1.UserService.generateToken(email, password);
        /* check for invalid credentials */
        if (result === null) {
            return res.status(Http_1.default.UNAUTHORIZED).json({ token: undefined });
        }
        /* everything is good, return token */
        return res.status(Http_1.default.OK).json({ token: result });
    });
}
exports.authenticate = authenticate;
/**
 * @param req HTTP request, has token in header
 * @param res HTTP response containing a list of Users in the body
 * @returns res with the appropriate code and the data
 */
function getAllUsers(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        return (0, helpers_1.verifyToken)(req, res, () => __awaiter(this, void 0, void 0, function* () {
            /* get all users */
            const users = yield services_1.UserService.getAllUsers();
            /* failed for some reason */
            if (users.response !== services_1.ServiceResponse.SUCCESS) {
                return (0, helpers_1.handleBadRes)(res, users.response, users.err);
            }
            return res.status(Http_1.default.OK).json({ users: users.result });
        }), true);
    });
}
exports.getAllUsers = getAllUsers;
/**
 * Used to retrieve user information.
 *
 * @param req HTTP request containing user token in the header.
 * @param res HTTP response containing user and their statistics in the body.
 * @returns res with the appropriate code and the data
 */
function getUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        return (0, helpers_1.verifyToken)(req, res, (user) => __awaiter(this, void 0, void 0, function* () {
            return res.status(Http_1.default.OK).json({
                user: user.export
            });
        }));
    });
}
exports.getUser = getUser;
/**
 * @param req HTTP request containing user information
 * @param res HTTP response containing token, if user information is valid
 * @param isAdmin if true, user becomes an admin
 * @returns res with the appropriate code and the data
 */
function register(req, res, isAdmin) {
    return __awaiter(this, void 0, void 0, function* () {
        /* check for invalid data */
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(Http_1.default.BAD).json({ errs: errors });
        }
        const { email, password } = req.body;
        /* check for missing data */
        if (!email || !password) {
            return res.status(Http_1.default.BAD).json({ err: "Missing data" });
        }
        /* try to generate token */
        const result = yield services_1.UserService.createUser(email, password, isAdmin);
        /* check for invalid credentials */
        if (result.response !== services_1.ServiceResponse.SUCCESS) {
            return (0, helpers_1.handleBadRes)(res, result.response, result.err);
        }
        /* everything is good, return token */
        return res.status(Http_1.default.OK).json({
            token: (yield (0, UserService_1.generateToken)(email, password))
        });
    });
}
exports.register = register;
/**
 * @param req HTTP request containing user information, and admin token in header
 * @param res HTTP response with user token in body if successful
 * @returns res with the appropriate code and the data
 */
function createUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        /* extract isAdmin from body, since register does not read it */
        const { isAdmin } = req.body;
        return (0, helpers_1.verifyToken)(req, res, () => __awaiter(this, void 0, void 0, function* () {
            return yield register(req, res, isAdmin);
        }), true);
    });
}
exports.createUser = createUser;
/**
 * @param req HTTP request containing user information, and admin token in header
 * @param res HTTP response with status code
 * @returns res with the appropriate code and the data
 */
function deleteUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        return (0, helpers_1.verifyToken)(req, res, () => __awaiter(this, void 0, void 0, function* () {
            const { email } = req.body;
            const deleteRes = yield services_1.UserService.deleteUser(email);
            /* if deletion has succeeded */
            if (deleteRes.response === services_1.ServiceResponse.SUCCESS) {
                return res.status(Http_1.default.OK).json();
            }
            return (0, helpers_1.handleBadRes)(res, deleteRes.response, deleteRes.err);
        }), true);
    });
}
exports.deleteUser = deleteUser;
/**
 * @param req HTTP request containing user information, and admin token in header
 * @param res HTTP response with status code
 * @returns res with the appropriate code and the data
 */
function setBanUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        return (0, helpers_1.verifyToken)(req, res, () => __awaiter(this, void 0, void 0, function* () {
            const { email, isBanned } = req.body;
            const result = yield services_1.UserService.setBanUser(email, isBanned);
            /* if change has succeeded */
            if (result.response === services_1.ServiceResponse.SUCCESS) {
                return res.status(Http_1.default.OK).json();
            }
            return (0, helpers_1.handleBadRes)(res, result.response, result.err);
        }), true);
    });
}
exports.setBanUser = setBanUser;
/**
 * @param req HTTP request containing user information, and user token in header
 * @param res HTTP response with status code
 * @returns res with the appropriate code and the data
 */
function updateUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        /* check for invalid data */
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(Http_1.default.BAD).json({ errs: errors });
        }
        return (0, helpers_1.verifyToken)(req, res, (user) => __awaiter(this, void 0, void 0, function* () {
            const { newPassword, newEmail } = req.body;
            /* set new user password */
            if (newPassword) {
                user.setPassword(newPassword);
            }
            /* set new user email */
            if (newEmail) {
                user.setEmail(newEmail);
            }
            const updateResult = yield services_1.UserService.updateUser(user);
            /* check if update succeeded */
            if (updateResult.response === services_1.ServiceResponse.SUCCESS) {
                return res.status(Http_1.default.OK).json();
            }
            return (0, helpers_1.handleBadRes)(res, updateResult.response, updateResult.err);
        }));
    });
}
exports.updateUser = updateUser;
