import React, { useRef, useEffect, useMemo, useCallback, useState } from "react";
import { motion } from "framer-motion";
import useVideoCallStore from "../../store/useVideoCallStore";
import { useUserStore } from "../../store/useUserStore";
import { useChatStore } from "../../store/useChatStore";
import { useSocketStore, getGlobalSocket } from "../../store/useSocketStore";
import { soundEffects } from "../../utils/soundEffects";
import {
  FaPhoneSlash,
  FaVideo,
  FaVideoSlash,
  FaMicrophone,
  FaMicrophoneSlash,
  FaPhone
} from "react-icons/fa";

// Interactive Slide To Answer Call Component
const SlideToAnswer = ({ onAnswer, onDecline, callType }) => {
  const containerRef = useRef(null);
  const [dragProgress, setDragProgress] = useState(0);
  const [hasTriggered, setHasTriggered] = useState(false);

  const maxDrag = 190;

  const handleDrag = (event, info) => {
    if (hasTriggered) return;
    const currentX = Math.max(0, Math.min(info.offset.x, maxDrag));
    const progress = currentX / maxDrag;
    setDragProgress(progress);

    if (progress >= 0.75) {
      setHasTriggered(true);
      onAnswer();
    }
  };

  const handleDragEnd = (event, info) => {
    if (hasTriggered) return;
    if (dragProgress < 0.75) {
      setDragProgress(0);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm px-4">
      {/* Interactive Framer Motion Slide Track */}
      <div
        ref={containerRef}
        className="relative w-full h-16 bg-slate-800/90 border border-emerald-500/40 rounded-full overflow-hidden flex items-center p-1 shadow-2xl backdrop-blur-md"
      >
        {/* Dynamic Glowing Fill Track */}
        <div
          className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 opacity-90 rounded-full transition-all duration-75"
          style={{ width: `${Math.max(16, dragProgress * 100)}%` }}
        />

        {/* Dynamic Text Prompt */}
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold uppercase tracking-widest text-emerald-200 pointer-events-none select-none pl-12">
          <span className="animate-pulse flex items-center gap-2">
            Slide to answer <FaPhone className="w-3 h-3 animate-bounce" />
          </span>
        </div>

        {/* Draggable Call Knob with Framer Motion physics */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: maxDrag }}
          dragElastic={0.05}
          dragSnapToOrigin={!hasTriggered}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          onClick={() => {
            if (!hasTriggered) {
              setHasTriggered(true);
              onAnswer();
            }
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative z-10 w-14 h-14 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/50 cursor-grab active:cursor-grabbing transition-colors flex-shrink-0"
        >
          {callType === "video" ? <FaVideo className="w-5 h-5 text-white" /> : <FaPhone className="w-5 h-5 text-white" />}
        </motion.div>
      </div>

      {/* Decline Call Button */}
      <button
        onClick={onDecline}
        className="px-6 py-2.5 bg-red-600/80 hover:bg-red-600 active:scale-95 text-white text-xs font-bold rounded-full flex items-center gap-2 shadow-lg hover:shadow-red-900/50 transition-all"
      >
        <FaPhoneSlash className="w-4 h-4" />
        <span>Decline Call</span>
      </button>
    </div>
  );
};

// WebRTC STUN configurations
const iceConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ]
};

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

// Module-level helper for live socket
const getSocket = () => getGlobalSocket() || useSocketStore.getState().socket;

const VideoCallModel = () => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const storeSocket = useSocketStore((state) => state.socket);

  const {
    currentCall,
    incomingCall,
    isCallActive,
    callType,
    localStream,
    remoteStream,
    isVideoEnabled,
    isAudioEnabled,
    peerConnection,
    isCallModelOpen,
    callStatus,
    setCurrentCall,
    setCallActive,
    setLocalStream,
    setRemoteStream,
    setPeerConnection,
    setCallStatus,
    addIceCandidate,
    processQueuedIceCandidates,
    toggleVideo,
    toggleAudio,
    endCall,
    clearIncomingCall,
    addCallHistoryRecord
  } = useVideoCallStore();

  const { user } = useUserStore();

  // Helper to record call log in history AND dispatch chat message thread entry
  const recordAndLogCall = useCallback((type, status, participantId, participantName, participantAvatar, isOutgoing = true) => {
    try {
      const startTime = useVideoCallStore.getState().callStartTime;
      const durationSecs = startTime ? Math.max(1, Math.floor((Date.now() - startTime) / 1000)) : 0;
      const durationFormatted = formatDuration(durationSecs);

      let logText = "";
      const isVideo = type === "video";
      const mediaIcon = isVideo ? "📹" : "📞";

      if (status === "ended") {
        logText = `${mediaIcon} ${isVideo ? "Video" : "Voice"} call ended • ${durationFormatted}`;
      } else if (status === "rejected" || status === "declined") {
        logText = `${mediaIcon} ${isVideo ? "Video" : "Voice"} call declined`;
      } else {
        logText = `${mediaIcon} Missed ${isVideo ? "video" : "voice"} call`;
      }

      // 1. Add record to Zustand call history store (and localStorage)
      addCallHistoryRecord({
        id: Date.now().toString(),
        contactId: participantId,
        name: participantName || "Unknown User",
        avatar: participantAvatar || null,
        callType: type || "video",
        direction: isOutgoing ? "outgoing" : (status === "ended" ? "incoming" : "missed"),
        status: status,
        duration: durationFormatted,
        durationSeconds: durationSecs,
        timestamp: new Date().toISOString()
      });

      // 2. Dispatch call summary message into active chat thread if possible
      const currentUserId = user?._id || user?.id;
      if (currentUserId && participantId) {
        const formData = new FormData();
        formData.append("senderId", currentUserId);
        formData.append("receiverId", participantId);
        formData.append("content", logText);
        formData.append("messageStatus", "sent");

        useChatStore.getState().sendMessage(formData).catch(() => {});
      }
    } catch (err) {
      console.error("[VideoCallModel] Failed to record call log:", err);
    }
  }, [user, addCallHistoryRecord]);

  // Memoize participant information to display on the screen
  const displayInfo = useMemo(() => {
    if (incomingCall && !isCallActive) {
      return {
        name: incomingCall.callerName,
        avatar: incomingCall.callerAvatar
      };
    } else if (currentCall) {
      return {
        name: currentCall.participantName,
        avatar: currentCall.participantAvatar
      };
    }
    return { name: "Unknown", avatar: null };
  }, [incomingCall, currentCall, isCallActive]);

  // Sound Effects Controller: Ringtone, Connected Chime, and Call Ended Tones
  useEffect(() => {
    if (!isCallModelOpen) {
      soundEffects.stopRingtone();
      return;
    }

    if (callStatus === "calling" || callStatus === "ringing" || (incomingCall && !isCallActive)) {
      soundEffects.startRingtone();
    } else if (callStatus === "connected") {
      soundEffects.playConnectedSound();
    } else if (callStatus === "ended" || callStatus === "rejected" || callStatus === "failed") {
      soundEffects.playEndedSound();
    }

    return () => {
      soundEffects.stopRingtone();
    };
  }, [callStatus, isCallModelOpen, incomingCall, isCallActive]);

  // Monitor connection states
  useEffect(() => {
    if (peerConnection && remoteStream) {
      setCallStatus("connected");
      setCallActive(true);
      console.log("WebRTC Connection successfully established and remote media acquired.");
    }
  }, [peerConnection, remoteStream, setCallStatus, setCallActive]);

  // Bind local media stream to local video element
  useEffect(() => {
    if (localVideoRef.current) {
      if (localStream) {
        localVideoRef.current.srcObject = localStream;
        localVideoRef.current.play().catch((err) => console.warn("Local preview play() notice:", err));
      } else {
        localVideoRef.current.srcObject = null;
      }
    }
  }, [localStream, isVideoEnabled]);

  // Bind remote media stream to remote video/audio element
  useEffect(() => {
    if (remoteVideoRef.current) {
      if (remoteStream) {
        console.log("[WebRTC] Attaching remoteStream to media element. Tracks:", remoteStream.getTracks());
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch((err) => console.warn("Remote playback play() notice:", err));
      } else {
        remoteVideoRef.current.srcObject = null;
      }
    }
  }, [remoteStream]);

  // Initialize media devices (Camera and Microphone)
  const initializeMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === "video" ? { width: 640, height: 480 } : false,
        audio: true
      });
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error("Failed to access camera/mic media devices:", error);
      // Smart Fallback: If webcam is in use by another tab/browser, fall back to audio-only stream
      if (callType === "video") {
        try {
          console.warn("[WebRTC] Webcam hardware in use. Falling back to audio-only stream...");
          const audioStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true
          });
          setLocalStream(audioStream);
          return audioStream;
        } catch (audioErr) {
          console.error("Audio fallback also failed:", audioErr);
        }
      }
      setCallStatus("failed");
      throw error;
    }
  }, [callType, setLocalStream, setCallStatus]);

  // Handle ending the call and emitting the endCall socket event
  const handleEndCall = useCallback(() => {
    const recipientId = currentCall?.participantId || incomingCall?.callerId;
    const recipientName = currentCall?.participantName || incomingCall?.callerName;
    const recipientAvatar = currentCall?.participantAvatar || incomingCall?.callerAvatar;
    const isOutgoing = !!currentCall;

    recordAndLogCall(
      callType || "video",
      callStatus === "connected" ? "ended" : "missed",
      recipientId,
      recipientName,
      recipientAvatar,
      isOutgoing
    );

    const sock = getSocket();
    if (recipientId && sock) {
      sock.emit("endCall", {
        callId: currentCall?.callId || incomingCall?.callId,
        participantId: recipientId
      });
    }
    endCall();
  }, [currentCall, incomingCall, callType, callStatus, endCall, recordAndLogCall]);

  // Create RTCPeerConnection and map track/candidate listeners
  const createPeerConnection = useCallback((stream) => {
    const pc = new RTCPeerConnection(iceConfiguration);

    // Attach local stream tracks to the peer connection
    if (stream) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    }

    // ICE Candidate generation callback
    pc.onicecandidate = (event) => {
      const state = useVideoCallStore.getState();
      const recipientId = state.currentCall?.participantId || state.incomingCall?.callerId;
      const callId = state.currentCall?.callId || state.incomingCall?.callId;
      const sock = getSocket();
      if (event.candidate && sock && recipientId) {
        sock.emit("webRtcIceCandidate", {
          candidate: event.candidate,
          receiverId: recipientId,
          callId
        });
      }
    };

    // Listen for incoming remote media tracks
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      } else {
        const fallbackStream = new MediaStream([event.track]);
        setRemoteStream(fallbackStream);
      }
    };

    // Monitor peer connection status
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") {
        setCallStatus("failed");
        setTimeout(() => {
          handleEndCall();
        }, 2000);
      }
    };

    setPeerConnection(pc);

    // Process pending offer if it arrived while media was initializing
    const pendingOffer = useVideoCallStore.getState().pendingOffer;
    if (pendingOffer) {
      (async () => {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(pendingOffer));
          useVideoCallStore.getState().setPendingOffer(null);
          await useVideoCallStore.getState().processQueuedIceCandidates();
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          const state = useVideoCallStore.getState();
          const recipientId = state.currentCall?.participantId || state.incomingCall?.callerId;
          const callId = state.currentCall?.callId || state.incomingCall?.callId;
          const sock = getSocket();
          if (sock && recipientId) {
            sock.emit("webRtcAnswer", { answer, receiverId: recipientId, callId });
          }
        } catch (err) {
          console.error("Failed processing pending SDP offer:", err);
        }
      })();
    }

    return pc;
  }, [setRemoteStream, setPeerConnection, setCallStatus, handleEndCall]);

  // ----------------------------------------------------
  // CALLER SEQUENCE: Triggered upon recipient acceptance
  // ----------------------------------------------------
  const initializeCallerFlow = useCallback(async () => {
    try {
      setCallStatus("connecting");
      const stream = await initializeMedia();
      const pc = createPeerConnection(stream);

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === "video"
      });

      await pc.setLocalDescription(offer);

      const sock = getSocket();
      const state = useVideoCallStore.getState();
      const targetCall = state.currentCall || currentCall;
      if (sock && targetCall) {
        sock.emit("webRtcOffer", {
          offer,
          receiverId: targetCall.participantId,
          callId: targetCall.callId
        });
      }
    } catch (error) {
      console.error("Caller initiation failed:", error);
      setCallStatus("failed");
      setTimeout(() => handleEndCall(), 2000);
    }
  }, [currentCall, callType, initializeMedia, createPeerConnection, setCallStatus, handleEndCall]);

  // ----------------------------------------------------
  // RECEIVER SEQUENCE: Handle accept call click
  // ----------------------------------------------------
  const handleAnswerCall = useCallback(async () => {
    try {
      setCallStatus("connecting");
      const stream = await initializeMedia();
      createPeerConnection(stream);

      const sock = getSocket();
      if (sock && incomingCall) {
        sock.emit("acceptCall", {
          callerId: incomingCall.callerId,
          callId: incomingCall.callId,
          receiverInfo: {
            username: user?.username || "Recipient",
            profilePicture: user?.profilePicture || null
          }
        });
      }

      if (incomingCall) {
        setCurrentCall({
          callId: incomingCall.callId,
          participantId: incomingCall.callerId,
          participantName: incomingCall.callerName,
          participantAvatar: incomingCall.callerAvatar
        });
        clearIncomingCall();
      }
    } catch (error) {
      console.error("Receiver answer sequence failed:", error);
      setCallStatus("failed");
      setTimeout(() => handleEndCall(), 2000);
    }
  }, [incomingCall, user, initializeMedia, createPeerConnection, setCurrentCall, clearIncomingCall, setCallStatus, handleEndCall]);

  // Handle reject call click
  const handleRejectCall = useCallback(() => {
    const recipientId = incomingCall?.callerId;
    const recipientName = incomingCall?.callerName;
    const recipientAvatar = incomingCall?.callerAvatar;

    recordAndLogCall(callType || "video", "rejected", recipientId, recipientName, recipientAvatar, false);

    const sock = getSocket();
    if (incomingCall && sock) {
      sock.emit("rejectCall", {
        callerId: incomingCall.callerId,
        callId: incomingCall.callId
      });
    }
    endCall();
  }, [incomingCall, callType, endCall, recordAndLogCall]);

  // Event listener for callAccepted window dispatch from VideoCallManager
  useEffect(() => {
    const handleAcceptedWindow = () => {
      initializeCallerFlow();
    };

    window.addEventListener("callAcceptedEvent", handleAcceptedWindow);
    return () => {
      window.removeEventListener("callAcceptedEvent", handleAcceptedWindow);
    };
  }, [initializeCallerFlow]);

  if (!isCallModelOpen) return null;

  const showActiveUi = isCallActive || callStatus === "calling" || callStatus === "connecting";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 text-white backdrop-blur-md">
      <div className="relative w-full h-full max-w-4xl max-h-[85vh] bg-slate-900 md:rounded-2xl overflow-hidden shadow-2xl flex flex-col">

        {/* Header containing Call Status */}
        <div className="absolute top-4 left-4 z-20 bg-black/55 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${callStatus === "connected" ? "bg-green-500 animate-pulse" : "bg-yellow-500 animate-bounce"}`} />
          {callStatus.toUpperCase()}
        </div>

        {/* 1. RINGING / INCOMING CALL MODAL VIEW */}
        {incomingCall && !isCallActive && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-slate-800 to-slate-950">
            <div className="mb-6 relative">
              <img
                src={displayInfo.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${incomingCall.callerId}`}
                alt={displayInfo.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-emerald-500 shadow-xl"
              />
              <span className="absolute bottom-1 right-1 bg-emerald-500 w-6 h-6 rounded-full border-2 border-slate-900 animate-ping" />
            </div>
            <h2 className="text-3xl font-bold mb-2">{displayInfo.name}</h2>
            <p className="text-emerald-400 text-sm tracking-widest uppercase animate-pulse mb-12">
              Incoming {callType} call...
            </p>

            {/* Slide To Answer Control */}
            <SlideToAnswer
              onAnswer={handleAnswerCall}
              onDecline={handleRejectCall}
              callType={callType}
            />
          </div>
        )}

        {/* 2. ACTIVE CALL VIEW (CONNECTED OR CONNECTING SCREEN) */}
        {showActiveUi && (
          <div className="flex-1 relative bg-black flex items-center justify-center">

            {/* Remote Media Element — ALWAYS mounted in DOM so audio plays for both voice & video calls */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={callType === "video" && remoteStream ? "w-full h-full object-cover" : "hidden"}
            />

            {/* Audio Call View — Avatar and Status */}
            {(callType !== "video" || !remoteStream) && (
              <div className="flex flex-col items-center justify-center text-center">
                <img
                  src={displayInfo.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=default`}
                  alt={displayInfo.name}
                  className="w-32 h-32 rounded-full object-cover border-2 border-slate-700 mb-4"
                />
                <h3 className="text-xl font-bold">{displayInfo.name}</h3>
                <p className="text-slate-400 text-sm">
                  {callStatus === "connected" ? "Voice call ongoing..." : "Connecting stream..."}
                </p>
              </div>
            )}

            {/* PIP Local Camera View in Video Calling */}
            {callType === "video" && localStream && (
              <div className="absolute top-4 right-4 w-36 h-48 md:w-44 md:h-56 bg-slate-900 border-2 border-white rounded-xl overflow-hidden shadow-2xl z-10 transition-all hover:scale-105">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isVideoEnabled ? "block" : "hidden"}`}
                />
                {!isVideoEnabled && (
                  <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-2 p-2 text-center">
                    <FaVideoSlash className="w-6 h-6 animate-pulse" />
                    <span className="text-[10px] font-bold tracking-wide">Camera Off</span>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Controls Bar */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-25 bg-slate-950/75 border border-slate-800/40 px-6 py-4 rounded-full flex items-center gap-6 backdrop-blur-md shadow-2xl">

              {/* Camera toggler */}
              {callType === "video" && (
                <button
                  onClick={toggleVideo}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isVideoEnabled ? "bg-slate-800 hover:bg-slate-700" : "bg-red-500 hover:bg-red-600"}`}
                  title={isVideoEnabled ? "Turn Camera Off" : "Turn Camera On"}
                >
                  {isVideoEnabled ? <FaVideo className="w-5 h-5 text-white" /> : <FaVideoSlash className="w-5 h-5 text-white" />}
                </button>
              )}

              {/* Mic toggler */}
              <button
                onClick={toggleAudio}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isAudioEnabled ? "bg-slate-800 hover:bg-slate-700" : "bg-red-500 hover:bg-red-600"}`}
                title={isAudioEnabled ? "Mute Microphone" : "Unmute Microphone"}
              >
                {isAudioEnabled ? <FaMicrophone className="w-5 h-5 text-white" /> : <FaMicrophoneSlash className="w-5 h-5 text-white" />}
              </button>

              {/* Cut Call Trigger */}
              <button
                onClick={handleEndCall}
                className="w-12 h-12 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-red-900/50"
                title="End Call"
              >
                <FaPhoneSlash className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* 3. CALL TERMINATED OR REJECTED UI */}
        {(callStatus === "rejected" || callStatus === "failed" || callStatus === "ended") && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-950">
            <div className="w-20 h-20 bg-red-900/30 rounded-full flex items-center justify-center text-red-500 mb-6">
              <FaPhoneSlash className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-2">
              {callStatus === "rejected" ? "Call Declined" : callStatus === "failed" ? "Connection Failed" : "Call Ended"}
            </h3>
            <p className="text-slate-400 text-sm">
              {callStatus === "rejected" ? "User is busy at the moment." : "Disconnecting session details..."}
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default VideoCallModel;
