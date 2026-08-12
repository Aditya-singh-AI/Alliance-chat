import React, { useEffect, useCallback } from "react";
import useVideoCallStore from "../../store/useVideoCallStore";
import { useUserStore } from "../../store/useUserStore";
import { useSocketStore, getGlobalSocket } from "../../store/useSocketStore";
import VideoCallModel from "./VideoCallModel";

// Module-level helper for non-stale live socket
const getSocket = () => getGlobalSocket() || useSocketStore.getState().socket;

const VideoCallManager = () => {
  const {
    setIncomingCall,
    setCurrentCall,
    setCallType,
    setCallModelOpen,
    setCallStatus,
    endCall
  } = useVideoCallStore();

  const { user } = useUserStore();
  const storeSocket = useSocketStore((state) => state.socket);

  // Set up socket event listeners in VideoCallManager (always mounted)
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    console.log("[VideoCallManager] Registering socket call event listeners on:", socket.id);

    const handleIncomingCall = ({ callerId, callerName, callerAvatar, callId, callType }) => {
      console.log("[VideoCallManager] Incoming call from:", callerName, callerId);
      setIncomingCall({
        callerId,
        callerName,
        callerAvatar,
        callId
      });
      setCallType(callType);
      setCallModelOpen(true);
      setCallStatus("ringing");
    };

    const handleCallFailed = () => {
      console.log("[VideoCallManager] Call failed or remote user offline");
      setCallStatus("failed");
      setTimeout(() => {
        endCall();
      }, 2000);
    };

    const handleCallAccepted = ({ receiverInfo, callId }) => {
      console.log("[VideoCallManager] Call accepted by:", receiverInfo?.username);
      useVideoCallStore.setState((state) => ({
        currentCall: state.currentCall ? {
          ...state.currentCall,
          participantName: receiverInfo?.username || state.currentCall.participantName,
          participantAvatar: receiverInfo?.profilePicture || state.currentCall.participantAvatar
        } : null
      }));
      window.dispatchEvent(new CustomEvent("callAcceptedEvent"));
    };

    const handleCallRejected = () => {
      console.log("[VideoCallManager] Call rejected");
      setCallStatus("rejected");
      setTimeout(() => {
        endCall();
      }, 2000);
    };

    const handleCallEnded = () => {
      console.log("[VideoCallManager] Call ended by remote participant");
      endCall();
    };

    const handleWebRtcOffer = async ({ offer, senderId, callId }) => {
      console.log("[VideoCallManager] Received webRtcOffer from:", senderId);
      const pc = useVideoCallStore.getState().peerConnection;
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          await useVideoCallStore.getState().processQueuedIceCandidates();
          window.dispatchEvent(new CustomEvent("webRtcOfferReceived"));
        } catch (e) {
          console.error("Error setting remote description for offer:", e);
        }
      } else {
        console.log("[VideoCallManager] PeerConnection not ready yet. Storing offer in pendingOffer...");
        useVideoCallStore.getState().setPendingOffer(offer);
      }
    };

    const handleWebRtcAnswer = async ({ answer, senderId, callId }) => {
      console.log("[VideoCallManager] Received webRtcAnswer from:", senderId);
      const pc = useVideoCallStore.getState().peerConnection;
      if (pc && pc.signalingState !== "stable") {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          await useVideoCallStore.getState().processQueuedIceCandidates();
        } catch (e) {
          console.error("Error setting remote description for answer:", e);
        }
      }
    };

    const handleWebRtcIceCandidate = async ({ candidate, senderId, callId }) => {
      const pc = useVideoCallStore.getState().peerConnection;
      if (pc && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error("Error adding WebRTC ICE Candidate:", error);
        }
      } else {
        useVideoCallStore.getState().addIceCandidate(candidate);
      }
    };

    socket.on("incomingCall", handleIncomingCall);
    socket.on("callFailed", handleCallFailed);
    socket.on("callAccepted", handleCallAccepted);
    socket.on("callRejected", handleCallRejected);
    socket.on("callEnded", handleCallEnded);
    socket.on("webRtcOffer", handleWebRtcOffer);
    socket.on("webRtcAnswer", handleWebRtcAnswer);
    socket.on("webRtcIceCandidate", handleWebRtcIceCandidate);

    return () => {
      socket.off("incomingCall", handleIncomingCall);
      socket.off("callFailed", handleCallFailed);
      socket.off("callAccepted", handleCallAccepted);
      socket.off("callRejected", handleCallRejected);
      socket.off("callEnded", handleCallEnded);
      socket.off("webRtcOffer", handleWebRtcOffer);
      socket.off("webRtcAnswer", handleWebRtcAnswer);
      socket.off("webRtcIceCandidate", handleWebRtcIceCandidate);
    };
  }, [storeSocket, setIncomingCall, setCallType, setCallModelOpen, setCallStatus, endCall]);

  // Initiate call action
  const initiateCall = useCallback((receiverId, receiverName, receiverAvatar, callType = "video") => {
    if (!user) {
      console.error("[VideoCallManager] Cannot initiate call: no authenticated user");
      return;
    }

    const socket = getSocket();
    if (!socket || !socket.connected) {
      console.error("[VideoCallManager] Cannot initiate call: socket not connected");
      return;
    }

    const callId = `${user._id || user.id}-${receiverId}-${Date.now()}`;
    const callData = {
      callId,
      participantId: receiverId,
      participantName: receiverName,
      participantAvatar: receiverAvatar
    };

    console.log("[VideoCallManager] Initiating", callType, "call to:", receiverName, receiverId);

    setCurrentCall(callData);
    setCallType(callType);
    setCallModelOpen(true);
    setCallStatus("calling");

    // Emit initiateCall to backend socket
    socket.emit("initiateCall", {
      callerId: user._id || user.id,
      receiverId,
      callType,
      callerInfo: {
        username: user.username,
        profilePicture: user.profilePicture
      }
    });
  }, [user, setCurrentCall, setCallType, setCallModelOpen, setCallStatus]);

  // Expose initiateCall function to Zustand store so ChatWindow buttons can use it
  useEffect(() => {
    useVideoCallStore.setState({ initiateCall });
  }, [initiateCall]);

  return <VideoCallModel />;
};

export default VideoCallManager;
