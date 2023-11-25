import {database, syncDatabase} from "../database";

/* check all model tables */
(async () => {
    await syncDatabase();
    await database.sync()
})();

export {default as User} from './User';
export {default as Session} from './Session';
export {default as Chat} from './Chat';
export {default as Attendee} from './SessionAttendee';
