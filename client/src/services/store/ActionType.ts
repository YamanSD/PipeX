/**
 * Enum class for the different actions that can
 * be applied to the Redux store.
 */
enum ActionType {
    AddParticipant = "ADD_PARTICIPANT",
    RemoveParticipant = "REMOVE_PARTICIPANT",
    SetUser = "SET_USER",
    UpdateUser = "UPDATE_USER",
    UpdateParticipant = "UPDATE_PARTICIPANT",
    SetPeers = "SET_PEERS"
}

export default ActionType;
