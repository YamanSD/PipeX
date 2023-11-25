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
exports.getAttendees = exports.addAttendee = void 0;
const helpers_1 = require("./helpers");
const Response_1 = __importDefault(require("./Response"));
const SessionService_1 = require("./SessionService");
const UserService_1 = require("./UserService");
const model_1 = require("../model");
/**
 * @param sessionId to add the user to.
 * @param uid ID of the user to add to the attendance.
 */
function addAttendee(sessionId, uid) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const temp = yield (0, SessionService_1.getSession)(sessionId);
            const userTemp = yield (0, UserService_1.getUser)(uid);
            /* check for failure */
            if (temp.response !== Response_1.default.SUCCESS || !temp.result) {
                return {
                    response: temp.response,
                    err: temp.err
                };
            }
            else if (userTemp.response !== Response_1.default.SUCCESS || !userTemp.result) {
                return {
                    response: userTemp.response,
                    err: userTemp.err
                };
            }
            const session = temp.result;
            const user = userTemp.result;
            const doesExist = yield model_1.Attendee.findAll({
                where: {
                    UserUid: user.uid,
                    SessionSessionId: sessionId
                }
            });
            /* check if it does not exist */
            if (doesExist === null) {
                yield model_1.Attendee.create({
                    SessionSessionId: session.sessionId,
                    UserUid: user.uid
                });
            }
            return {
                response: Response_1.default.SUCCESS
            };
        }
        catch (e) {
            return (0, helpers_1.handleError)(e);
        }
    });
}
exports.addAttendee = addAttendee;
/**
 * @param sessionId to get the users for.
 * @returns list of attended users.
 */
function getAttendees(sessionId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return {
                result: yield model_1.Attendee.findAll({
                    where: {
                        sessionSessionId: sessionId
                    },
                    attributes: ['UserUid', 'updatedAt']
                }),
                response: Response_1.default.SUCCESS
            };
        }
        catch (e) {
            return (0, helpers_1.handleError)(e);
        }
    });
}
exports.getAttendees = getAttendees;
