const handleVideoCallEvents = (socket, io, onlineUsers) => {
  // 1. INITIATE CALL
  socket.on("initiateCall", ({ callerId, receiverId, callType, callerInfo }) => {
    const receiverSocketId = onlineUsers.get(receiverId);

    if (receiverSocketId) {
      // Create a unique Call ID
      const callId = `${callerId}-${receiverId}-${Date.now()}`;

      // Emit incomingCall to receiver
      io.to(receiverSocketId).emit("incomingCall", {
        callerId,
        callerName: callerInfo.username || "Unknown",
        callerAvatar: callerInfo.profilePicture || null,
        callId,
        callType
      });
    } else {
      console.log(`Receiver ${receiverId} is offline`);
      socket.emit("callFailed", { reason: "User is offline" });
    }
  });

  // 2. ACCEPT CALL
  socket.on("acceptCall", ({ callerId, callId, receiverInfo }) => {
    const callerSocketId = onlineUsers.get(callerId);

    if (callerSocketId) {
      // Emit callAccepted to caller
      io.to(callerSocketId).emit("callAccepted", {
        receiverInfo,
        callId
      });
    } else {
      console.log(`Caller ${callerId} not found`);
      socket.emit("callFailed", { reason: "Caller is offline" });
    }
  });

  // 3. REJECT CALL
  socket.on("rejectCall", ({ callerId, callId }) => {
    const callerSocketId = onlineUsers.get(callerId);

    if (callerSocketId) {
      // Emit callRejected to caller
      io.to(callerSocketId).emit("callRejected", { callId });
    }
  });

  // 4. END CALL
  socket.on("endCall", ({ callId, participantId }) => {
    const participantSocketId = onlineUsers.get(participantId);

    if (participantSocketId) {
      // Emit callEnded to the other participant
      io.to(participantSocketId).emit("callEnded", { callId });
    }
  });

  // 5. WEBRTC SIGNALLING: OFFER
  socket.on("webRtcOffer", ({ offer, receiverId, callId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("webRtcOffer", {
        offer,
        senderId: socket.userId,
        callId
      });
    } else {
      console.log(`Receiver ${receiverId} not found for WebRTC offer`);
    }
  });

  // 6. WEBRTC SIGNALLING: ANSWER
  socket.on("webRtcAnswer", ({ answer, receiverId, callId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("webRtcAnswer", {
        answer,
        senderId: socket.userId,
        callId
      });
    } else {
      console.log(`Receiver ${receiverId} not found for WebRTC answer`);
    }
  });

  // 7. WEBRTC SIGNALLING: ICE CANDIDATE
  socket.on("webRtcIceCandidate", ({ candidate, receiverId, callId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("webRtcIceCandidate", {
        candidate,
        senderId: socket.userId,
        callId
      });
    } else {
      console.log(`Receiver ${receiverId} not found for WebRTC ICE candidate`);
    }
  });
};

module.exports = handleVideoCallEvents;
