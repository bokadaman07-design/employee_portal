/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211f",
        mist: "#f6f7f4",
        line: "#dce2dc",
        pine: "#1f6f5b",
        coral: "#c85f4d",
        gold: "#b7892b"
      },
      boxShadow: {
        soft: "0 14px 40px rgba(23, 33, 31, 0.08)"
      }
    },
  },
  plugins: [],
};
