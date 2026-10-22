export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0b1020',
        panel: '#111827',
        card: '#172033',
        primary: '#3b82f6',
        accent: '#22c55e',
        warn: '#f59e0b',
        danger: '#ef4444'
      },
      boxShadow: {
        glow: '0 0 30px rgba(59,130,246,0.35)'
      }
    }
  },
  plugins: []
}
