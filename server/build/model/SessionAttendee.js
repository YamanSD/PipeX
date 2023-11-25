"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../database");
/*
 * Simple junction table for the User-Session M-N attendee association.
 * Foreign keys from each table are generated
 */
const SessionAttendee = database_1.database.define('Attendee', {});
exports.default = SessionAttendee;
