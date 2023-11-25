import {database} from "../database";

/*
 * Simple junction table for the User-Session M-N attendee association.
 * Foreign keys from each table are generated
 */
const SessionAttendee = database.define('Attendee', {});

export default SessionAttendee;
