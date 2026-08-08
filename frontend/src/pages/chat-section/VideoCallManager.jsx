import React, { useEffect, useCallback } from "react";
import useVideoCallStore from "../../store/useVideoCallStore";
import { useUserStore } from "../../store/useUserStore";
import { useSocketStore, getGlobalSocket } from "../../store/useSocketStore";
import VideoCallModel from "./VideoCallModel";

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
  // Subscribe reactively so the component re-renders when the socket connects
  const storeSocket = useSocketStore((state) => state.socket);

  // Always use the live global socket ref for emitting
  const getSocket = () => getGlobalSocket() || storeSocket;

  // Handle incoming call event from socket
  const handleIncomingCall = useCallback(({ callerId, callerName, callerAvatar, callId, callType }) => {
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
  }, [setIncomingCall, setCallType, setCallModelOpen, setCallStatus]);

  // Handle call failure/offline state
  const handleCallEnded = useCallback(() => {
    setCallStatus("failed");
    setTimeout(() => {
      endCall();
    }, 2000);
  }, [setCallStatus, endCall]);

  // Set up socket event listeners — re-runs whenever storeSocket changes
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    console.log("[VideoCallManager] Registering socket call event listeners on:", socket.id);

    socket.on("incomingCall", handleIncomingCall);
    socket.on("callFailed", handleCallEnded);

    return () => {
      socket.off("incomingCall", handleIncomingCall);
      socket.off("callFailed", handleCallEnded);
    };
  }, [storeSocket, handleIncomingCall, handleCallEnded]);

  // Initiate call action — uses getSocket() at invocation time to guarantee a live reference
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
  }, [user, storeSocket, setCurrentCall, setCallType, setCallModelOpen, setCallStatus]);

  // Expose initiateCall function to Zustand store so ChatWindow buttons can use it
  useEffect(() => {
    useVideoCallStore.setState({ initiateCall });
  }, [initiateCall]);

  // Pass the live socket to VideoCallModel
  return <VideoCallModel />;
};

export default VideoCallManager;
