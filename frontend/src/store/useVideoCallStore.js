import { create } from "zustand";

const getSavedCallHistory = () => {
  try {
    const saved = localStorage.getItem("talkative_call_history");
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

const saveCallHistory = (history) => {
  try {
    localStorage.setItem("talkative_call_history", JSON.stringify(history));
  } catch (e) {}
};

const useVideoCallStore = create((set, get) => ({
  // State variables
  currentCall: null,
  incomingCall: null,
  isCallActive: false,
  callType: null, // "video" or "audio"

  // Media streams
  localStream: null,
  remoteStream: null,
  isVideoEnabled: true,
  isAudioEnabled: true,

  // WebRTC
  peerConnection: null,
  iceCandidatesQueue: [],
  isCallModelOpen: false,
  callStatus: "idle", // "idle", "calling", "ringing", "connecting", "connected", "ended", "failed", "rejected"
  callStartTime: null,

  // Call history
  callHistory: getSavedCallHistory(),

  // Actions
  setCurrentCall: (call) => set({ currentCall: call }),
  setIncomingCall: (call) => set({ incomingCall: call }),
  setCallActive: (active) => set({ isCallActive: active }),
  setCallType: (type) => set({ callType: type }),
  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteStream: (stream) => set({ remoteStream: stream }),
  setPeerConnection: (pc) => set({ peerConnection: pc }),
  setCallModelOpen: (open) => set({ isCallModelOpen: open }),
  setCallStatus: (status) => {
    if (status === "connected" && !get().callStartTime) {
      set({ callStatus: status, callStartTime: Date.now() });
    } else {
      set({ callStatus: status });
    }
  },

  // History management
  addCallHistoryRecord: (record) => {
    const updated = [record, ...get().callHistory];
    saveCallHistory(updated);
    set({ callHistory: updated });
  },

  clearCallHistory: () => {
    saveCallHistory([]);
    set({ callHistory: [] });
  },

  // Add ICE Candidate to Queue
  addIceCandidate: (candidate) => set((state) => ({
    iceCandidatesQueue: [...state.iceCandidatesQueue, candidate]
  })),

  // Process Queued ICE Candidates
  processQueuedIceCandidates: async () => {
    const { peerConnection, iceCandidatesQueue } = get();
    if (peerConnection && peerConnection.remoteDescription && iceCandidatesQueue.length > 0) {
      for (const candidate of iceCandidatesQueue) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("ICE candidate successfully added to PeerConnection");
        } catch (error) {
          console.error("Error adding queued ICE candidate", error);
        }
      }
      set({ iceCandidatesQueue: [] });
    }
  },

  // Toggle Video
  toggleVideo: () => {
    const { localStream, isVideoEnabled } = get();
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        set({ isVideoEnabled: !isVideoEnabled });
      }
    }
  },

  // Toggle Audio
  toggleAudio: () => {
    const { localStream, isAudioEnabled } = get();
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
        set({ isAudioEnabled: !isAudioEnabled });
      }
    }
  },

  // End Call & Reset State
  endCall: () => {
    const { localStream, peerConnection } = get();

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    if (peerConnection) {
      peerConnection.close();
    }

    set({
      currentCall: null,
      incomingCall: null,
      isCallActive: false,
      callType: null,
      localStream: null,
      remoteStream: null,
      isVideoEnabled: true,
      isAudioEnabled: true,
      peerConnection: null,
      iceCandidatesQueue: [],
      isCallModelOpen: false,
      callStatus: "idle",
      callStartTime: null
    });
  },

  // Clear Incoming Call Info
  clearIncomingCall: () => set({ incomingCall: null })
}));

export default useVideoCallStore;
