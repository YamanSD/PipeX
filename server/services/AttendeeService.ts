import {handleError, Result} from "./helpers";
import Response from "./Response";
import {getSession} from "./SessionService";
import {getUser} from "./UserService";
import {Attendee} from "../model";


/**
 * @param sessionId to add the user to.
 * @param uid ID of the user to add to the attendance.
 */
export async function addAttendee(sessionId: number, uid: string): Result {
    try {
        const temp = await getSession(sessionId);
        const userTemp = await getUser(uid);

        /* check for failure */
        if (temp.response !== Response.SUCCESS || !temp.result) {
            return {
                response: temp.response,
                err: temp.err
            };
        } else if (userTemp.response !== Response.SUCCESS || !userTemp.result) {
            return {
                response: userTemp.response,
                err: userTemp.err
            };
        }

        const session = temp.result;
        const user = userTemp.result;

        const doesExist = await Attendee.findAll({
            where: {
                UserUid: user.uid,
                SessionSessionId: sessionId
            }
        });

        /* check if it does not exist */
        if (doesExist === null) {
            await Attendee.create({
                SessionSessionId: session.sessionId,
                UserUid: user.uid
            });
        }

        return {
            response: Response.SUCCESS
        };
    } catch (e) {
        return handleError(e);
    }
}

/**
 * @param sessionId to get the users for.
 * @returns list of attended users.
 */
export async function getAttendees(sessionId: number): Result<{UserUid: number}[]> {
    try {
        return {
            result: await Attendee.findAll({
                where: {
                    sessionSessionId: sessionId
                },
                attributes: ['UserUid', 'updatedAt']
            }) as unknown as {UserUid: number}[],
            response: Response.SUCCESS
        }
    } catch (e) {
        return handleError(e);
    }
}
