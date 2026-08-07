/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        talkative: {
          light: "#6C63FF",
          dark: "#4A42CC",
          purple: "#3B1F8C",
          accent: "#FF6584",
          cyan: "#43E8D8",
          background: "#F0EDFF",
        },
      },
      animation: {
        "infinite-loading": "loading 1.5s infinite",
      },
      keyframes: {
        loading: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(400%)" },
        },
      },
    },
  },
  plugins: [],
};
