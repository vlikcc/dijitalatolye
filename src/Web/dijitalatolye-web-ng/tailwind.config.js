/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  darkMode: ['class', '[data-theme="dark"]'],
  corePlugins: {
    // Angular Material kendi reset'ini sağladığı için Tailwind preflight devre dışı bırakılır.
    preflight: false,
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        script: ['"Dancing Script"', '"Instrument Serif"', 'cursive'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Semantik, temaya duyarlı tokenlar (CSS değişkenlerinden okunur)
        bg: "rgb(var(--bg) / <alpha-value>)",
        bg2: "rgb(var(--bg-2) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        panel: "rgb(var(--panel) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        dim: "rgb(var(--dim) / <alpha-value>)",
        line: "rgb(var(--border) / <alpha-value>)",

        // İZBO mavi — birincil marka rengi (eski "brand" referansları için uyumlu skala)
        brand: {
          50: "#eef6fb",
          100: "#d4e8f2",
          200: "#a7d0e6",
          300: "#6fb0d4",
          400: "#3a8cbb",
          500: "#1a72a3",
          600: "#0b5f8c",
          700: "#094e74",
          800: "#0a3f5e",
          900: "#0a2f46",
        },
        // Semantik birincil vurgu (temaya göre mavi/cyan) + İZBO mor skala bir arada.
        // bg-accent / text-accent => DEFAULT (semantik), bg-accent-500 => mor skala.
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          50: "#f1eefe",
          100: "#e0d9fc",
          200: "#c8b8f9",
          300: "#a78bfa",
          400: "#8b6bf0",
          500: "#6f4ee0",
          600: "#5a3fcb",
          700: "#4a32a8",
          800: "#3c2986",
          900: "#2c1d66",
        },
        // İkincil vurgu — mor (temaya duyarlı)
        accent2: "rgb(var(--accent-2) / <alpha-value>)",
        // Bilimsel parıltı — cyan
        cyan2: "#0cb5db",
        // Sıcak altın vurgu
        warm: {
          400: "#f5c95d",
          500: "#d6a52f",
          600: "#b57f1f",
        },
      },
      backgroundImage: {
        "grid-line":
          "linear-gradient(to right, rgb(var(--grid-line)) 1px, transparent 1px), linear-gradient(to bottom, rgb(var(--grid-line)) 1px, transparent 1px)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgb(var(--border)), 0 18px 40px -18px rgb(var(--accent) / 0.45)",
        card: "0 1px 0 rgb(var(--border)), 0 24px 48px -28px rgb(10 19 40 / 0.25)",
      },
      keyframes: {
        "float-slow": { "0%, 100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-12px)" } },
        "fade-up": { "0%": { opacity: "0", transform: "translateY(14px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "pulse-dot": { "0%, 100%": { opacity: "0.4", transform: "scale(1)" }, "50%": { opacity: "1", transform: "scale(1.25)" } },
        "drift": { "0%, 100%": { transform: "translate(0,0)" }, "50%": { transform: "translate(8px,-10px)" } },
      },
      animation: {
        "float-slow": "float-slow 6s ease-in-out infinite",
        "fade-up": "fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both",
        "pulse-dot": "pulse-dot 3.5s ease-in-out infinite",
        "drift": "drift 9s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
