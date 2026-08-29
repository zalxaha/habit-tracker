import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0F1226",
          900: "#0B0D1D",
          800: "#14172F",
          700: "#1C2044",
          600: "#262B58",
        },
        parchment: {
          DEFAULT: "#EDEAE1",
          dim: "#9AA0C8",
        },
        gold: {
          DEFAULT: "#F2C879",
          dim: "#B99A56",
        },
        ember: {
          DEFAULT: "#F0876A",
          dim: "#C96B52",
        },
        sage: {
          DEFAULT: "#8FCB9B",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        stars:
          "radial-gradient(1px 1px at 20px 30px, rgba(237,234,225,0.35), transparent), radial-gradient(1px 1px at 90px 80px, rgba(237,234,225,0.25), transparent), radial-gradient(1.5px 1.5px at 150px 40px, rgba(237,234,225,0.3), transparent), radial-gradient(1px 1px at 200px 120px, rgba(237,234,225,0.2), transparent)",
      },
    },
  },
  plugins: [],
};
export default config;
