import { create } from "zustand";
import { persist } from "zustand/middleware";

// Step-wise registration workflow state with local storage persistence
export const useLoginStore = create(
  persist(
    (set) => ({
      step: 1, // Default starting step (1 = Phone/Email, 2 = OTP, 3 = Profile)
      userPhoneData: null, // Temporarily caches phone/email inputs between steps
      setStep: (step) => set({ step }),
      setUserPhoneData: (data) => set({ userPhoneData: data }),
      resetLoginState: () => set({ step: 1, userPhoneData: null }), // Purges all caches
    }),
    {
      name: "talkative-login-storage", // localStorage key
    },
  ),
);
