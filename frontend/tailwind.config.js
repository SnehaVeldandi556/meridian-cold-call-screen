/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#0029FF",
          dark: "#0F172A",
          muted: "#64748B",
          border: "#E2E8F0",
          card: "#FFFFFF",
          bg: "#F8FAFC"
        }
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Geist Mono', 'SFMono-Regular', 'Menlo', 'monospace']
      }
    },
  },
  plugins: [],
}
