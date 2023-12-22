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
 * >- PREFERENCE: a user changed their preferences.
 * >- TERMINATE: a user terminated their session.
 * >- READY: a user is ready to initiate a call.
 * >- TRANSCRIPT: a user sent their transcript.
 */
enum Event {
    CONNECTION = "connection",
    DISCONNECT = "disconnect",
    MSG = "message",
    CREATE = "create",
    JOIN = "join",
    LEAVE = "leave",
    TERMINATE = "terminate",
    PREFERENCE = "preference",
    READY = "ready",
    TRANSCRIPT = "transcript"
}

export default Event;
