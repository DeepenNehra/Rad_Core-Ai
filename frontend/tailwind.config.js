/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        medical: {
          dark: '#0a0e1a',
          panel: '#0f1629',
          border: '#1e2d4a',
          accent: '#00d4ff',
          critical: '#ff4444',
          warning: '#ffaa00',
          success: '#00cc88',
          text: '#c8d8f0',
          muted: '#6b7fa3',
        }
      }
    }
  },
  plugins: []
}
