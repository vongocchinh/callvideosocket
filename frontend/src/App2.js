/* eslint-disable no-useless-escape */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useRef, useState } from "react";
import { useEffect } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import Peer from "simple-peer";
import io from "socket.io-client";
import { Phone } from "@material-ui/icons";
import { TextField } from "@material-ui/core";
import { Button } from "@material-ui/core";
// import { IconButton } from "@material-ui/core";
// import { PhoneIcon } from "@material-ui/icons";

const socket = io.connect("http://localhost:5000");
export default function App2() {
  const myVideo = useRef();
  const userVideo = useRef();
  const [stream, setStream] = useState();
  const [me, setMe] = useState();
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [name, setName] = useState("");
  const [userName, setUserName] = useState("");
  const [idToCall, setIdToCall] = useState("");
  const [receivingCall, setReceivingCall] = useState(false);
  const connectionRef = useRef();
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [music, setMusic] = useState(false);
  const [audio] = useState(
    new Audio("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3")
  );
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        myVideo.current.srcObject = stream;
      });
    socket.on("me", (id) => {
      setMe(id);
    });
    // setReceivingCall
    socket.on("callUser", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setUserName(data.name);
      setCallerSignal(data.signal);
      setMusic(true);
    });
  }, []);
  useEffect(() => {
    music ? audio.play() : audio.pause();
  }, [music]);
  useEffect(() => {
    audio.addEventListener("ended", () => setMusic(false));
    return () => {
      audio.removeEventListener("ended", () => setMusic(false));
    };
  }, []);
  const callUser = (id) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });
    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: me,
        name: name,
      });
    });
    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream;
    });
    socket.on("callAccepted", (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
  };
  // roi cuoc goi tat
  const leaveCall = () => {
    setCallEnded(true);
    connectionRef.current.destroy();
    //
  };
  // bat may
  const answerCall = () => {
    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });
    peer.on("signal", (data) => {
      socket.emit("answerCall", { signal: data, to: caller });
    });
    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream;
    });

    peer.signal(callerSignal);
    connectionRef.current = peer;
    setMusic(false);
  };

  const answerNotCall = () => {
    // connectionRef.current.destroy();
    socket.emit("disconnect", () => {
      setMusic(false);
      setCallAccepted(false);
      setReceivingCall(false);
    });
  };
  return (
    <>
      {stream && (
        <video
          playsInline
          ref={myVideo}
          muted
          autoPlay
          style={{ width: 300 }}
        />
      )}
      {callAccepted && !callEnded ? (
        <video
          playsInline
          autoPlay
          ref={userVideo}
          style={{ width: 300, marginLeft: 50 }}
        />
      ) : null}

      <br />
      <input onChange={(e) => setName(e.target.value)} />
      <CopyToClipboard text={me} style={{ marginBottom: "2rem" }}>
        <button
          variant="contained"
          color="primary"
          startIcon={<Phone fontSize="large" />}
        >
          Copy ID
        </button>
      </CopyToClipboard>
      {/* id cua ho */}
      <TextField
        id="filled-basic"
        label="ID to call"
        variant="filled"
        value={idToCall}
        onChange={(e) => setIdToCall(e.target.value)}
      />
      <br />

      {callAccepted && !callEnded ? (
        <Button variant="contained" color="secondary" onClick={leaveCall}>
          End Call
        </Button>
      ) : (
        <div
          color="primary"
          aria-label="call"
          onClick={() => callUser(idToCall)}
        >
          <Phone fontSize="large" />
        </div>
      )}
      <br />
      {receivingCall && !callAccepted ? (
        <div className="caller">
          <h1>{userName} is calling...</h1>
          <Button variant="contained" color="primary" onClick={answerCall}>
            Answer
          </Button>
          <Button variant="contained" color="primary" onClick={answerNotCall}>
            Tắt
          </Button>
        </div>
      ) : null}
    </>
  );
}
