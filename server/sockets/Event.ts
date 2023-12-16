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
 * >- SEND_SIGNAL: a user sent a WebRTC signal.
 * >- RETURN_SIGNAL: forward WebRTC signal to another user.
 */
enum Event {
    DISCONNECT = "diconnect",
    CONNECT = "connect",
    MSG = "message",
    CREATE = "create",
    JOIN = "join",
    LEAVE = "leave",
    TERMINATE = "terminate",
    PREFERENCE = "preference",
    SEND_SIGNAL = "send_signal",
    RETURN_SIGNAL = "return_signal"
}

export default Event;
