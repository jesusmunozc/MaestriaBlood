/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        blood: {
          50: "rgb(var(--blood-50) / <alpha-value>)",
          100: "rgb(var(--blood-100) / <alpha-value>)",
          200: "rgb(var(--blood-200) / <alpha-value>)",
          300: "rgb(var(--blood-300) / <alpha-value>)",
          400: "rgb(var(--blood-400) / <alpha-value>)",
          500: "rgb(var(--blood-500) / <alpha-value>)",
          600: "rgb(var(--blood-600) / <alpha-value>)",
          700: "rgb(var(--blood-700) / <alpha-value>)",
          800: "rgb(var(--blood-800) / <alpha-value>)",
          900: "rgb(var(--blood-900) / <alpha-value>)",
          950: "rgb(var(--blood-950) / <alpha-value>)",
        },
        primary: {
          50: "rgb(var(--blood-50) / <alpha-value>)",
          100: "rgb(var(--blood-100) / <alpha-value>)",
          200: "rgb(var(--blood-200) / <alpha-value>)",
          300: "rgb(var(--blood-300) / <alpha-value>)",
          400: "rgb(var(--blood-400) / <alpha-value>)",
          500: "rgb(var(--blood-500) / <alpha-value>)",
          600: "rgb(var(--blood-600) / <alpha-value>)",
          700: "rgb(var(--blood-700) / <alpha-value>)",
          800: "rgb(var(--blood-800) / <alpha-value>)",
          900: "rgb(var(--blood-900) / <alpha-value>)",
          950: "rgb(var(--blood-950) / <alpha-value>)",
        },
        surface: {
          DEFAULT: "#1A1A2E",
          card: "#16213E",
          elevated: "#0F3460",
        },
        // ── Semantic theme colors (CSS variables) ─────────────────────────
        "app-bg": "rgb(var(--app-bg) / <alpha-value>)",
        "app-card": "rgb(var(--app-card) / <alpha-value>)",
        "app-card-alt": "rgb(var(--app-card-alt) / <alpha-value>)",
        "app-border": "rgb(var(--app-border) / <alpha-value>)",
        "app-text": "rgb(var(--app-text) / <alpha-value>)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      animation: {
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "fade-in": "fadeIn 0.25s ease-out",
        "pulse-blood": "pulseBlood 2s ease-in-out infinite",
        "drop-fall": "dropFall 1.5s ease-in-out infinite",
        "bounce-slow": "bounce 2s ease-in-out infinite",
      },
      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pulseBlood: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.1)", opacity: "0.8" },
        },
        dropFall: {
          "0%": { transform: "translateY(-30px) scale(0.8)", opacity: "0" },
          "50%": { transform: "translateY(5px) scale(1)", opacity: "1" },
          "100%": { transform: "translateY(20px) scale(0.9)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
