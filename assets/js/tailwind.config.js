/* Tailwind Play CDN configuration (loaded after the CDN script).
   Kept in an external file so no inline scripts are required. */
tailwind.config = {
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        neon: {
          green: "#00ff9c",
          cyan: "#2dd4ff",
          purple: "#b478ff",
          amber: "#ffc857",
          red: "#ff5d73",
        },
        ink: {
          900: "#05080d",
          800: "#0a1019",
          700: "#0c131d",
          600: "#101925",
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
    },
  },
};
