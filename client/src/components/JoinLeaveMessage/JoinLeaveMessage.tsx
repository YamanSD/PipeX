import React from 'react';

/**
 * Type alias for the properties of the component.
 */
type Properties = {
    join: boolean,
    uid: string,
};

/**
 * @param uid ID of the user that joined or left.
 * @param join true user joined, false user left.
 * @constructor
 */
const JoinLeaveMessage = ({uid, join}: Properties) => {
    return <div style={{
        width: "100%",
        textAlign: "center",
        alignItems: "center",
        display: "flex",
        justifyContent: "center",
        marginTop: "10px",
        flexDirection: "row",
        paddingBottom: "4px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.3)",
        marginBottom: "10px"
    }}>
        <p style={{color: join ? "#3498ff" : "#ea4335", fontSize: "12", fontWeight: 600}}>
            {`${uid}`}
        </p>
        &nbsp;
        <p style={{color: "white", fontSize: "12", margin: 0, fontWeight: 500}}>
            {` ${join ? "joined" : "left"} the session`}
        </p>
    </div>
};

export default JoinLeaveMessage;
