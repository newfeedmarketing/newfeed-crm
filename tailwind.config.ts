import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#00193A",
        "navy-light": "#0A2A55",
        brand: "#FF5A19",
        "brand-dark": "#E14B0F",
      },
    },
  },
  plugins: [],
};
export default config;
