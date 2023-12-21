// import React, {useEffect, useRef, useState} from 'react';
// import {Socket} from "socket.io-client";
// import {EmitterCallback} from "../../services/socket-api/config";
// import {Listener, Emitter} from '../../services';
// import Participant from "../Participant/Participant";
// import {GridLoader} from "react-spinners";
// import styled from "styled-components";
// import {toast} from "react-toastify";
// import {useNavigate} from "react-router-dom";
// import Peer from "simple-peer";
// import Event from "../../services/socket-api/Event";
//
//
// /**
//  * Type alias for the prop-type of the component.
//  */
// type Properties = {
//     uid: string,
//     sessionId: string,
//     create: boolean,
//     mic: boolean,
//     cam: boolean,
//     socket: Socket,
//     initUsers: {[uid: string]: {audio: boolean, video: boolean}},
//     callback: EmitterCallback,
//     streamRef: React.MutableRefObject<MediaStream | undefined>
// };
//
// /**
//  * Type alias for the payload response.
//  *
//  * >- signal: specific to WebRTC.
//  * >- sender: UID of the sender.
//  * >- audio: if true, user has audio active.
//  * >- video: if true, user has video active.
//  */
// type PayloadType = {
//     signal: any,
//     sender: string,
//     audio: boolean,
//     video: boolean,
//     target: string,
// };
//
// /* computes the factors of a number */
// const factors = (number: number) => Array
//     .from(Array(number + 1), (_, i) => i)
//     .filter(i => number % i === 0)
//
// /**
//  * Grid layout for the cameras
//  */
// const Grid = styled.div`
//     width: 98vw;
//     height: 100%;
//     padding: 10px 0 10px 10px;
//     display: grid;
//     float: right;
//     grid-column-gap: 10px;
//     grid-row-gap: 10px;
// `;
//
// /**
//  * Type alias for peers state.
//  */
// type PeersType = {
//     [uid: string]: {
//         peer: Peer.Instance;
//         audio: boolean;
//         video: boolean;
//     }
// };
//
// /**
//  * @param target ID of the target user to signal.
//  * @param stream media stream.
//  * @param callback callback response function.
//  * @returns the created peer.
//  * @private
//  */
// function createPeer(
//     target: string,
//     stream: MediaStream,
//     callback: EmitterCallback): Peer.Instance {
//     const peer = new Peer({
//         initiator: true,
//         trickle: false,
//         stream: stream
//     });
//
//     peer.on('signal', (signal: any) => {
//         Emitter.sendSignal(signal, target, callback);
//     });
//
//     return peer;
// }
//
// /**
//  * @param incomingSignal signal sent from sender.
//  * @param sender ID of the sender user to signal.
//  * @param stream media stream.
//  * @param callback callback response function.
//  * @returns the created peer.
//  * @private
//  */
// function addPeer(
//     incomingSignal: any,
//     sender: string,
//     stream: MediaStream,
//     callback: EmitterCallback): Peer.Instance {
//     const peer = new Peer({
//         initiator: false,
//         trickle: false,
//         stream,
//     });
//
//     peer.on('signal', (signal: any) => {
//         Emitter.sendReturn(signal, sender, callback);
//     });
//
//     /* signal the other peer */
//     peer.signal(incomingSignal);
//
//     return peer;
// }
//
// /**
//  * @param uid ID of this user.
//  * @param sessionId ID of the created session.
//  * @param socket of the user.
//  * @param initUsers initial users in the session.
//  * @param streamRef reference to the user stream.
//  * @param create true session is created, not joined.
//  * @param callback for the session startup.
//  * @param cam state of user camera.
//  * @param mic state of user audio.
//  * @constructor
//  */
// const ParticipantGrid = ({uid, create, cam, mic,
//                              sessionId, initUsers, streamRef,
//                              callback, socket}: Properties) => {
//     const navigation = useNavigate();
//     const [isReady, setIsReady] = useState(false);
//     const [grid, setGrid] = useState({rows: 0, cols: 0});
//     const userVideo = useRef<HTMLVideoElement>(null);
//
//     /* state for the peers */
//     const [peers, setPeers] = useState<PeersType>({});
//
//     /* copy of state, to prevent rerender loop */
//     const peersRef = useRef<PeersType>({});
//     const [isPresenter, setIsPresenter] = useState(false);
//
//     useEffect(() => {
//         navigator.mediaDevices.getUserMedia({
//             video: true,
//             audio: true
//         }).then((stream) => {
//             streamRef.current = stream;
//
//             if (userVideo.current) {
//                 userVideo.current.srcObject = stream;
//             }
//
//             const tempPeers: PeersType = {};
//
//             /* add users already in the session */
//             Object.keys(initUsers).forEach((userId) => {
//                 if (userId === uid) {
//                     return;
//                 }
//
//                 const peer = createPeer(userId, stream, callback);
//                 tempPeers[userId] = {
//                     peer: peer,
//                     audio: initUsers[userId].audio,
//                     video: initUsers[userId].video
//                 };
//             });
//
//             setPeers({...tempPeers});
//
//             Listener.onLeave((res) => {
//                 delete peersRef.current[res.uid];
//                 setPeers({...peersRef.current});
//             });
//
//             Listener.onMute((res) => {
//                 if (res.uid !== uid) {
//                     peersRef.current[res.uid].audio = res.value;
//                     setPeers({...peersRef.current});
//                 }
//             });
//
//             Listener.onHide((res) => {
//                 if (res.uid !== uid) {
//                     peersRef.current[res.uid].video = res.value;
//                     setPeers({...peersRef.current});
//                 }
//             });
//
//             /* activate the on user join listener */
//             socket.on(Event.SEND_SIGNAL, (payload: PayloadType) => {
//                 const peer = addPeer(
//                     payload.signal,
//                     payload.sender,
//                     stream,
//                     callback
//                 );
//
//                 peersRef.current[payload.sender] = {
//                     peer: peer,
//                     audio: payload.audio,
//                     video: payload.video
//                 };
//
//                 setPeers({...peersRef.current});
//             });
//
//             /* activate the on user join respond */
//             socket.on(Event.RETURN_SIGNAL, (payload: PayloadType) => {
//                 if (peersRef.current[payload.sender]) {
//                     const peer = peersRef.current[payload.sender].peer;
//                     peer.signal(payload.signal);
//                 }
//             });
//
//             setIsReady(true);
//         });
//     }, [callback, initUsers, socket, uid, create, mic, cam, streamRef]);
//
//     useEffect(() => {
//         Listener.onTermination(() => {
//
//             navigation('/home');
//             toast.info("Session terminated", {
//                 toastId: 'sessionTerminated2',
//             });
//         });
//     }, [navigation]);
//
//     /* modify grid dims */
//     useEffect(() => {
//         const uids = Object.keys(peers);
//         let factorList = factors(uids.length);
//
//         if (factorList.length === 2) {
//             // Prime number, so calculate for closest even
//             factorList = factors(uids.length + 1);
//         }
//
//         const listLength = factorList.length;
//         const cols = factorList[listLength / 2 - (listLength % 2 === 0 ? 1 : 0)];
//         const rows = factorList[listLength / 2];
//
//         setGrid({
//             cols,
//             rows,
//         });
//     }, [peers, isPresenter, uid]);
//
//     return isReady ? (
//         <div
//             style={{
//                 height: "100%",
//                 width: "100%"
//             }}
//         >
//             <Grid style={{
//                 gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
//                 gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
//             }}>
//                 <Participant
//                     userRef={userVideo}
//                     isUser={true}
//                     bstream={streamRef.current}
//                     key={`${uid}`}
//                     peer={undefined}
//                     uid={uid}
//                     isMuted={!mic}
//                     isHidden={!cam}
//                 />
//                 {/* add the users */}
//                 {
//                     Object.keys(peers).map((userId, index) => {
//                         return userId !== uid ? (
//                             <Participant
//                                 bstream={streamRef.current?.clone()}
//                                 isUser={false}
//                                 key={`${index}`}
//                                 peer={peers[userId].peer}
//                                 uid={userId}
//                                 isMuted={false}
//                                 isHidden={false}
//                             />
//                         ) : null;
//                     })
//                 }
//             </Grid>
//         </div>
//     ) : <GridLoader size={20} color="#3498ff" />;
// };
//
// export default ParticipantGrid;

const ParticipantGrid = () => {
    return null;
}

export default ParticipantGrid;