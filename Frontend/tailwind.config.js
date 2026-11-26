/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#125B55",
        primaryDark: "#0F4A45",
        ivory: "#FAF8F2",
        sage: "#E8F0E9",
        amber: "#E5AD46",
        amberDark: "#D99A2E",
        charcoal: "#202E35",
        muted: "#66756F",
        border: "#DFE7E2",
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
      },
      fontFamily: {
        en: ["Inter", "sans-serif"],
        ur: ["Noto Nastaliq Urdu", "Inter", "sans-serif"],
        ar: ["Noto Naskh Arabic", "Inter", "sans-serif"],
        hi: ["Noto Sans Devanagari", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
