// import React, {useEffect, useRef, useState} from 'react';
// import {useLocation, useNavigate, useParams} from "react-router-dom";
// import {ActionBar, ParticipantGrid} from "../../components";
// import {Emitter, Http, LocalStorage} from '../../services';
// import {toast} from "react-toastify";
// import {User} from "../../services/storage/LocalStorage";
//
//
// /**
//  * Type alias for the prop-type of the screen.
//  */
// type Properties = {
//     setShowNavBar: React.Dispatch<React.SetStateAction<boolean>>,
// };
//
// /**
//  * @param setShowNavBar setter for the navbar visibility.
//  * @constructor
//  */
// const ConferenceScreen = ({setShowNavBar}: Properties) => {
//     const {initMic, initCam} = useParams();
//     const [mic, setMic] = useState<boolean>(initMic === "true");
//     const [cam, setCam] = useState<boolean>(initCam === "true");
//     const streamRef = useRef<MediaStream>();
//     const callbackRef = useRef((res: any) => {console.log(res)});
//     const navigation = useNavigate();
//     const user = useRef(LocalStorage.getUser() as User);
//     const location = useLocation();
//     const {sessionId, create, sessionPassword, initUsers} = location.state as {
//         sessionId: string,
//         create: boolean,
//         sessionPassword?: string,
//         initUsers?: {[uid: string]: any}
//     };
//     const initUsersRef = useRef(initUsers ?? {});
//
//     if (!sessionId) {
//         navigation("/confInfo");
//         toast.error("Invalid session ID", {
//             toastId: 'invalidSession',
//         });
//     }
//
//     useEffect(() => {
//         setShowNavBar(false);
//     }, [location.pathname, setShowNavBar]);
//
//     return (
//         <div style={{
//             width: "100vw",
//             display: "flex",
//             background: "rgb(84, 86, 91)",
//             flexDirection: "column",
//             alignItems: "center",
//             justifyContent: "center"
//         }}>
//             <div style={{
//                 position: "absolute",
//                 top: 0,
//                 left: 0,
//                 overflowY: "scroll",
//                 overflowX: "hidden",
//                 display: "grid",
//                 width: "100%",
//                 height: "90%",
//                 background: "rgb(23,22,22)",
//                 flexDirection: "column",
//                 alignItems: "center",
//                 justifyContent: "center"
//             }}>
//                 <ParticipantGrid
//                     cam={cam}
//                     mic={mic}
//                     initUsers={initUsersRef.current}
//                     create={create}
//                     streamRef={streamRef}
//                     uid={user.current.uid}
//                     sessionId={sessionId}
//                     socket={Emitter.refreshSocket()}
//                     callback={callbackRef.current}
//                 />
//             </div>
//              <ActionBar
//                 mic={mic}
//                 cam={cam}
//                 onIdClick={async () => {
//                     await navigator.clipboard.writeText(`${sessionId}`);
//                 }}
//                 onPassClick={async () => {
//                     await navigator.clipboard.writeText(`${sessionPassword}`);
//                 }}
//                 onLeave={() => {
//                     /* stop camera and mic */
//                     streamRef.current?.getTracks().forEach(t => {
//                         t.stop();
//                     });
//
//                     navigation("/home");
//                 }}
//                 onMicChange={(v) => {
//                     Emitter.mute(v, (res) => {
//                         if (res.response === Http.OK) {
//                             setMic(v);
//                             streamRef.current?.getAudioTracks().forEach(t => {
//
//                                 t.enabled = !v;
//                             });
//                         } else {
//                             toast.error(`${res.err}`, {
//                                 toastId: "muteFail"
//                             });
//                         }
//                     });
//                 }}
//                 onCamChange={(v) => {
//                     Emitter.hide(v, (res) => {
//                         if (res.response === Http.OK) {
//                             setCam(v);
//                             streamRef.current?.getVideoTracks().forEach(t => {
//                                 t.enabled = !v;
//                             });
//                         } else {
//                             toast.error(`${res.err}`, {
//                                 toastId: "hideFail"
//                             });
//                         }
//                     });
//                 }}
//                 onShareScreenChange={() => {}} />
//         </div>
//     );
// }
//
// export default ConferenceScreen;

const ConferenceScreen = () => {
    return null;
}

export default ConferenceScreen;
