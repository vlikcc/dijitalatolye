/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Morpa-inspired purple
        brand: {
          50: "#f6f1ff",
          100: "#ebdfff",
          200: "#d6bdff",
          300: "#b88dff",
          400: "#9a5cff",
          500: "#7e36e6",
          600: "#6822c4",
          700: "#52189c",
          800: "#3f1278",
          900: "#2c0c54",
        },
        // Morpa-style warm orange accent
        accent: {
          50: "#fff5ec",
          100: "#ffe4cc",
          200: "#ffc599",
          300: "#ffa566",
          400: "#ff8a3d",
          500: "#f58220",
          600: "#d96d12",
          700: "#b3550c",
        },
      },
      backgroundImage: {
        "grid-slate": "linear-gradient(to right, rgba(82,24,156,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(82,24,156,0.06) 1px, transparent 1px)",
      },
      keyframes: {
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "float-slow": "float-slow 6s ease-in-out infinite",
        "fade-up": "fade-up 0.6s ease-out both",
      },
    },
  },
  plugins: [],
};
