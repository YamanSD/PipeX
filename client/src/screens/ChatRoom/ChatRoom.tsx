import React, {useCallback, useEffect, useRef, useState} from "react";
import {ChatMessage, JoinLeaveMessage, StateSetter} from "../../components";
import TextField from '@mui/material/TextField';
import {Emitter, Http, Listener, LocalStorage} from '../../services';
import useSound from 'use-sound';
import {FiSend, FiCopy} from "react-icons/fi";
import {toast} from "react-toastify";
import {useLocation, useNavigate} from "react-router-dom";
import styled from "styled-components";
import {Button, FormControl, Grid, InputLabel, MenuItem, Select} from "@mui/material";
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';


const MainContainer = styled.div`
    width: 98vw;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
    background-color: #3c4043;
`;

const BottomContainer = styled.form`
    width: 100%;
    background-color: #232222;
    display: flex;
    flex-direction: row;
    position: fixed;
    bottom: 0;
  left: 0;
    border-top: 5px solid #3498ff;
    padding: 10px 5px 10px 10px;
    justify-content: space-evenly;
    align-items: center;
`;

/**
 * Type of messages.
 */
interface Message {
    sender: string,
    directed: boolean,
    message: string,
    timestamp: number,
    receiver?: string
}

interface JoinLeaveMsg {
    uid: string,
    join: boolean
}

/**
 * Type alias for the prop-type of the screen.
 */
type Properties = {
    setShowNavBar: StateSetter<boolean>
};

/**
 * @param setShowNavBar setter for the navbar visibility.
 * @constructor
 */
export default function ChatRoom({setShowNavBar}: Properties) {
    const [messageText, setMessageText] = useState("");
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<(Message | JoinLeaveMsg)[]>([]);
    const dummy = useRef<HTMLDivElement>(null);
    const user = useRef(LocalStorage.getUser());
    const [users, setUsers] = useState<{[uid: string]: boolean}>({});
    const navigation = useNavigate();
    const firstActivation = useRef(true);
    const [target, setTarget] = useState<string>("Everyone");
    const location = useLocation();
    const {sessionId, create, sessionPassword, initUsers} = location.state as {
        sessionId: number | string,
        create: boolean,
        sessionPassword?: string,
        initUsers?: {[uid: string]: any}
    };

    /* check if session ID is valid */
    if (!sessionId) {
        navigation("/webChatInfo");
        toast.error("Invalid session ID", {
            toastId: 'badSessionId',
        });
    }

    /* used to play message sounds */
    const [receiveSound] = useSound(require('../../assets/sounds/imessage_receive.mp3'));
    const [sendSound] = useSound(require('../../assets/sounds/imessage_send.mp3'));

    /* on termination listener */
    useEffect(() => {
        Listener.onTermination(() => {
            toast.info("Session terminated", {
                toastId: 'termSuccess',
            });
            const user = LocalStorage.getUser();

            if (user) {
                user.currentRoom = undefined;
                LocalStorage.setUser(user);
            }

            navigation('/home');
        });
    }, [navigation])

    /* users listener */
    useEffect(() => {
        if (initUsers) {
            const temp: {[u: string]: boolean} = {};

            Object.keys(initUsers).forEach(u => {
                temp[u] = true;
            });

            setUsers({...temp});
        }
    }, [initUsers]);


    /* hides app navbar */
    useEffect(() => {
        setShowNavBar(false);
    }, [location.pathname, setShowNavBar]);

    /* scrolls to bottom on message */
    useCallback(() => {
        if (dummy.current) {
            dummy.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    /* activate listeners only once */
    if (firstActivation.current) {
        firstActivation.current = false;

        /* on message listener */
        Listener.onMsg((message) => {
            messages.push(message);
            setMessages([...messages]);

            if (message.sender !== user.current?.uid) {
                receiveSound();
            }
        });

        /* on leave listener */
        Listener.onLeave((res) => {
            users[res.uid] = false;
            setUsers({...users});
            messages.push({
                uid: res.uid,
                join: false
            });
            setMessages([...messages]);
        });

        /* on join listener */
        Listener.onJoin((res) => {
            users[res.uid] = true;
            setUsers({...users});
            messages.push({
                uid: res.uid,
                join: true
            });
            setMessages([...messages]);
        });
    }

    /**
     * Handles sending a message.
     * @param event
     */
    const handleCreateMessage = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        if (messageText && dummy.current) {
            const didSucceed = await (new Promise<boolean>((resolve) => {
              Emitter.sendMsg(
                  messageText,
                  target === "Everyone" ? undefined : target,
                  (res) => {
                  if (res.response !== Http.OK) {
                      resolve(false);
                  } else {
                      resolve(true);
                  }
              });
            }));
            
            if (didSucceed) {
                sendSound();
                setMessageText("");
                dummy.current.scrollIntoView({ behavior: "smooth" });
            } else {
                toast.error("Couldn't send message", {
                    toastId: 'badMsg',
                });
            }
        }
    };

  return (
      <>
          <AppBar style={{ paddingBottom: "10px", paddingTop: "10px" }} position="static">
              <Toolbar>
                  <Grid container spacing={2}>
                      {create &&
                          <Grid item>
                              <Button
                                  color="error"
                                  variant="contained"
                                  onClick={() => {
                                      Emitter.terminateSession(sessionPassword ?? "", (res) => {});
                                  }}
                              >
                                  Terminate
                              </Button>
                          </Grid>
                      }
                      <Grid item>
                          <Button
                              color="error"
                              variant="contained"
                              onClick={() => {
                                  navigation('/home');
                              }}
                          >
                              Leave
                          </Button>
                      </Grid>
                      <Grid item>
                          <Button
                              onClick={() => navigator.clipboard.writeText(`${sessionId}`)}
                              variant="contained"
                              endIcon={<FiCopy size={16} />}
                          >
                              Copy ID
                          </Button>
                      </Grid>
                      {sessionPassword && (
                          <Grid item>
                              <Button
                                  onClick={() => navigator.clipboard.writeText(`${sessionPassword}`)}
                                  variant="contained"
                                  endIcon={<FiCopy size={16} />}
                              >
                                  Copy Password
                              </Button>
                          </Grid>
                      )}
                      <Grid item>
                          <FormControl fullWidth>
                              <InputLabel style={{
                                  color: "white",
                                  fontWeight: "bold",
                                  padding: "0 5px",
                                  border: "1px solid #3498ff",
                                  backgroundColor: "#28282a",
                                  borderRadius: "5px"
                              }}>
                                  Send to:
                              </InputLabel>
                              <Select
                                  variant={"outlined"}
                                  style={{
                                      border: "2px solid #3498ff",
                                      fontWeight: "bold",
                                      color: "white",
                                      backgroundColor: "#3c4043"
                                  }}
                                  labelId="dropdown-label"
                                  id="dropdown"
                                  value={target}
                                  label="Send to"
                                  defaultValue={"Everyone"}
                                  onChange={(e) => {setTarget(e.target.value)}}
                              >
                                  <MenuItem
                                      style={{backgroundColor: "#28282a", color: "white"}}
                                      value={"Everyone"}
                                  >
                                      Everyone
                                  </MenuItem>
                                  {
                                      Object.keys(users).map((u, i) => {
                                          return (
                                              <MenuItem
                                                  style={{backgroundColor: "#28282a", color: "white"}}
                                                  value={u}
                                                  key={i}
                                              >
                                                  {u}
                                              </MenuItem>
                                          );
                                      })
                                  }
                              </Select>
                          </FormControl>
                      </Grid>
                  </Grid>
              </Toolbar>
          </AppBar>
        <MainContainer>
          {
              messages.map(m => {
                  if ("message" in m) {
                      m = m as Message;

                      return (
                          <ChatMessage
                              text={m.message}
                              createdAt={m.timestamp}
                              sender={m.sender}
                              directed={m.directed}
                              receiver={m.receiver}
                          />
                      );
                  } else {
                      m = m as JoinLeaveMsg;
                      return (
                          <JoinLeaveMessage join={m.join} uid={m.uid} />
                      );
                  }
              })
          }
          <div id={"scrollDest"} style={{marginTop: "5px", height: "90px"}} ref={dummy} />
          <BottomContainer>
              <TextField
                  placeholder={"message"}
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  inputProps={{
                      maxLength: 127,
                      style: {
                          fontFamily: "poppins",
                          color: "white",
                          fontWeight: 500,
                  }}}
                  color={'primary'}
                  sx={{
                      backgroundColor: "#28282a",
                      width: "92%",
                      borderRadius: "10px",
                  }}
                  focused
                  multiline
              />
              <div style={{
                  margin: "0 10px 0 10px",
                  height: '100%'
              }}>
                  <Button onClick={handleCreateMessage}
                          variant="contained"
                          sx={{height: "100%"}}
                          type={'submit'}
                          size={"large"}>
                      <FiSend size={22} color={"white"} />
                  </Button>
              </div>

          </BottomContainer>
      </MainContainer>
      </>
  );
}
