import {Chat, User} from '../model';
import {getUser} from './UserService';
import {handleError, Result} from "./helpers";
import Response from "./Response";
import {Op} from "sequelize";


/**
 * @param sessionId to add the chat to.
 * @param msg message content.
 * @param sender email of the sender.
 * @param receiver email of the receiver.
 * @returns created chat if successful, otherwise undefined.
 */
export async function addChat(sessionId: number, msg: string,
                              sender: string, receiver?: string): Result<Chat> {
    try {
        /* get first sender */
        const senderRes = await getUser(sender);
        let receiverId: number | undefined = undefined;

        if (senderRes.response !== Response.SUCCESS) {
            return {
                response: senderRes.response,
                err: `${senderRes.err} :user: ${sender}`
            };
        }

        /* check receiver */
        if (receiver) {
            const recRes = await getUser(receiver);

            if (recRes.response !== Response.SUCCESS) {
                return {
                    response: recRes.response,
                    err: recRes.err
                };
            }

            receiverId = recRes.result?.uid;
        }

        /* get sender ID */
        const senderId = (senderRes.result as User).uid;

        return {
            result: await Chat.create({
                session_id: sessionId,
                chat_sender: senderId,
                chat_receiver: receiverId,
                msg: msg
            }),
            response: Response.SUCCESS
        };
    } catch (e) {
        return handleError(e);
    }
}

/**
 * Type alias for exported chat.
 */
export type ExportChat = {
    sender: string,
    receiver: null | string,
    message: string,
    chat_timestamp: number
};

/**
 * @param sessionId to get chat logs for.
 * @param creatorId ID of the creator.
 * @returns chat logs if successful.
 */
export async function getSessionChat(sessionId: number, creatorId: number): Result<ExportChat[]> {
    try {
        const chats: Chat[] = await Chat.findAll({
            // @ts-ignore, false error ([Op.is]: null). Field is nullable but TS does not detect.
            where: {
                session_id: sessionId,
                [Op.or]: {
                    chat_receiver: {
                        [Op.or]: {
                            [Op.is]: null,
                            [Op.eq]: creatorId
                        }
                    },
                    chat_sender: creatorId
                }
            }
        });

        const result: ExportChat[] = [];

        for (const chat of chats) {
            const userRes = await getUser(chat.senderId);
            if (userRes.response !== Response.SUCCESS || !userRes.result) {
                return {
                    response: userRes.response,
                    err: userRes.err
                };
            }

            let receiver = null;

            if (chat.receiverId) {
                const receiverRes = await getUser(chat.receiverId);

                if (receiverRes.response !== Response.SUCCESS || !receiverRes.result) {
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
            response: Response.SUCCESS
        };
    } catch (e) {
        return handleError(e);
    }
}
