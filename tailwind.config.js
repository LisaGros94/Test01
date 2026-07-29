/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        ink: "var(--ink)",
        tint: "var(--tint)",
        mid: "var(--mid)",
        hairline: "var(--hairline)",
        oxblood: "var(--oxblood)",
      },
      fontFamily: {
        sans: "var(--font-sans)",
      },
      letterSpacing: {
        label: "0.16em",
      },
      borderRadius: {
        DEFAULT: "2px",
      },
      transitionDuration: {
        DEFAULT: "150ms",
      },
    },
  },
  plugins: [],
};
