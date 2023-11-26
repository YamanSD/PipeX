/**
 * Enum class for the socket.io events.
 * Provides better maintainability.
 *
 * >- CONNECTION: user connected.
 * >- DISCONNECT: user disconnected.
 * >- MSG: used to send messages.
 * >- JOIN: user joined.
 * >- LEAVE: user left.
 * >- CREATE: user wants to create a session.
 * >- HIDE: user changed their camera status.
 * >- MUTE: user changed their mic status.
 * >- TERMINATE: user terminated their session.
 * >- SEND_SIGNAL: user sent a WebRTC signal.
 * >- RETURN_SIGNAL: forward WebRTC signal to another user.
 */
enum Event {
    CONNECTION = "connection",
    DISCONNECT = "disconnect",
    MSG = "message",
    CREATE = "create",
    JOIN = "join",
    LEAVE = "leave",
    TERMINATE = "terminate",
    MUTE = "mute",
    HIDE = "hide",
    SEND_SIGNAL = "send_signal",
    RETURN_SIGNAL = "return_signal"
}

export default Event;
