export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        forest: { DEFAULT: '#0f3b2c', 700: '#134a37', 600: '#1b5a44', 500: '#2a6d55' },
        cream: '#f6f3ea',
        paper: '#fdfbf6',
        line: '#e8e2d2',
        gold: { DEFAULT: '#a87a22', soft: '#f4ead3', bright: '#d4a94a' },
        sage: { DEFAULT: '#e3ece6', ink: '#2f6b52' },
        ink: '#14261e',
        muted: '#68756d',
        danger: '#b4432f',
        amber: { soft: '#fbf1dc', ink: '#8a5a12' },
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
    },
  },
};
