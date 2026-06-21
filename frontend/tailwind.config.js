/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#17211f",
        mist: "#f6f7f4",
        line: "#dce2dc",
        pine: "#1f6f5b",
        coral: "#c85f4d",
        gold: "#b7892b",
        // Dark theme surfaces, mirroring the light palette roles:
        // night = page background, panel = raised surface (cards/forms),
        // edge = borders/dividers, fog = primary text on dark.
        night: "#0f1513",
        panel: "#18211f",
        edge: "#2c3733",
        fog: "#e7ebe6"
      },
      boxShadow: {
        soft: "0 14px 40px rgba(23, 33, 31, 0.08)"
      }
    },
  },
  plugins: [],
};
