// tailwind.config.js
const { heroui } = require("@heroui/react");

// Keep this ramp in sync with --color-brand-* in src/app/globals.css.
const brand = {
  50: "#F3F8FC",
  100: "#E5EEF8",
  200: "#CCDFF1",
  300: "#A6C8E7",
  400: "#6BA3D8",
  500: "#3E86C7",
  600: "#2A6AAA",
  700: "#1E5088",
  800: "#173F6B",
  900: "#102C4C",
  // 600, not 500: DEFAULT carries white foreground text, which needs >= 4.5:1
  // (600 gives 5.61, 500 only 3.86).
  DEFAULT: "#2A6AAA",
  foreground: "#FFFFFF",
};

const success = {
  50: "#EDF9F3",
  100: "#D3F0E2",
  200: "#A9E1C6",
  300: "#74CCA4",
  400: "#43B283",
  500: "#1F9D6B",
  600: "#147F56",
  700: "#0F6845",
  800: "#0C5238",
  900: "#083B29",
  DEFAULT: "#1F9D6B",
  foreground: "#FFFFFF",
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: brand,
            success,
            focus: brand.DEFAULT,
          },
        },
        dark: {
          colors: {
            // Lift the primary a step on dark surfaces so it keeps contrast.
            primary: { ...brand, DEFAULT: "#6BA3D8", foreground: "#0A1B2E" },
            success: { ...success, DEFAULT: "#43B283", foreground: "#062418" },
            focus: brand.DEFAULT,
          },
        },
      },
    }),
  ],
};
