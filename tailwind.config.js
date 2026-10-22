export default {
  plugins: [],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#07111f',
        panel: '#0c1628',
        cyanGlow: '#22d3ee'
      },
      boxShadow: {
        glow: '0 0 30px rgba(34, 211, 238, 0.45)'
      }
    }
  },
  variants: {
    extend: {}
  },
  corePlugins: {
    preflight: true
  }
}
