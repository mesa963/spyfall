/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        spy: {
          dark: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          gold: '#eab308',
          red: '#ef4444',
          crimson: '#dc2626',
          cyan: '#06b6d4',
          accent: '#38bdf8'
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      }
    },
  },
  plugins: [],
}
