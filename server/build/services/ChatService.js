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
exports.getSessionChat = exports.addChat = void 0;
const model_1 = require("../model");
const UserService_1 = require("./UserService");
const helpers_1 = require("./helpers");
const Response_1 = __importDefault(require("./Response"));
const sequelize_1 = require("sequelize");
/**
 * @param sessionId to add the chat to.
 * @param msg message content.
 * @param sender email of the sender.
 * @param receiver email of the receiver.
 * @returns created chat if successful, otherwise undefined.
 */
function addChat(sessionId, msg, sender, receiver) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            /* get first sender */
            const senderRes = yield (0, UserService_1.getUser)(sender);
            let receiverId = undefined;
            if (senderRes.response !== Response_1.default.SUCCESS) {
                return {
                    response: senderRes.response,
                    err: `${senderRes.err} :user: ${sender}`
                };
            }
            /* check receiver */
            if (receiver) {
                const recRes = yield (0, UserService_1.getUser)(receiver);
                if (recRes.response !== Response_1.default.SUCCESS) {
                    return {
                        response: recRes.response,
                        err: recRes.err
                    };
                }
                receiverId = (_a = recRes.result) === null || _a === void 0 ? void 0 : _a.uid;
            }
            /* get sender ID */
            const senderId = senderRes.result.uid;
            return {
                result: yield model_1.Chat.create({
                    session_id: sessionId,
                    chat_sender: senderId,
                    chat_receiver: receiverId,
                    msg: msg
                }),
                response: Response_1.default.SUCCESS
            };
        }
        catch (e) {
            return (0, helpers_1.handleError)(e);
        }
    });
}
exports.addChat = addChat;
/**
 * @param sessionId to get chat logs for.
 * @param creatorId ID of the creator.
 * @returns chat logs if successful.
 */
function getSessionChat(sessionId, creatorId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const chats = yield model_1.Chat.findAll({
                // @ts-ignore, false error ([Op.is]: null). Field is nullable but TS does not detect.
                where: {
                    session_id: sessionId,
                    [sequelize_1.Op.or]: {
                        chat_receiver: {
                            [sequelize_1.Op.or]: {
                                [sequelize_1.Op.is]: null,
                                [sequelize_1.Op.eq]: creatorId
                            }
                        },
                        chat_sender: creatorId
                    }
                }
            });
            const result = [];
            for (const chat of chats) {
                const userRes = yield (0, UserService_1.getUser)(chat.senderId);
                if (userRes.response !== Response_1.default.SUCCESS || !userRes.result) {
                    return {
                        response: userRes.response,
                        err: userRes.err
                    };
                }
                let receiver = null;
                if (chat.receiverId) {
                    const receiverRes = yield (0, UserService_1.getUser)(chat.receiverId);
                    if (receiverRes.response !== Response_1.default.SUCCESS || !receiverRes.result) {
                        return {
                            response: receiverRes.response,
                            err: receiverRes.err
                        };
                    }
                    receiver = receiverRes.result.email;
                }
                result.push({
                    sender: userRes.result.email,
                    receiver: receiver,
                    chat_timestamp: chat.timestamp,
                    message: chat.message
                });
            }
            result.sort((c0, c1) => {
                return c0.chat_timestamp - c1.chat_timestamp;
            });
            return {
                result: result,
                response: Response_1.default.SUCCESS
            };
        }
        catch (e) {
            return (0, helpers_1.handleError)(e);
        }
    });
}
exports.getSessionChat = getSessionChat;
