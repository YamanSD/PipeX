"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Enum class for the socket.io events.
 * Provides better maintainability.
 *
 * >- DISCONNECT: a user disconnected.
 * >- CONNECT: a user connected.
 * >- MSG: used to send messages.
 * >- JOIN: a user joined.
 * >- LEAVE: a user left.
 * >- CREATE: a user wants to create a session.
 * >- HIDE: a user changed their camera status.
 * >- MUTE: a user changed their mic status.
 * >- TERMINATE: a user terminated their session.
 * >- SEND_SIGNAL: a user sent a WebRTC signal.
 * >- RETURN_SIGNAL: forward WebRTC signal to another user.
 */
var Event;
(function (Event) {
    Event["DISCONNECT"] = "diconnect";
    Event["CONNECT"] = "connect";
    Event["MSG"] = "message";
    Event["CREATE"] = "create";
    Event["JOIN"] = "join";
    Event["LEAVE"] = "leave";
    Event["TERMINATE"] = "terminate";
    Event["MUTE"] = "mute";
    Event["HIDE"] = "hide";
    Event["SEND_SIGNAL"] = "send_signal";
    Event["RETURN_SIGNAL"] = "return_signal";
})(Event || (Event = {}));
exports.default = Event;
