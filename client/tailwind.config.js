/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // "Solar" — Sun-gold/orange, used as the main brand/action color
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        // "Space" — deep navy used for the sidebar / dark surfaces
        space: {
          50: '#f1f5f9',
          100: '#e2e8f0',
          200: '#cbd5e1',
          300: '#94a3b8',
          400: '#64748b',
          500: '#334155',
          600: '#1e293b',
          700: '#172033',
          800: '#0f172a',
          900: '#0b1120',
          950: '#060a14',
        },
        // "Orbit" — cool blue accent (Earth), used sparingly for links/info states
        orbit: {
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
        },
      },
      backgroundImage: {
        'solar-gradient': 'linear-gradient(135deg, #fbbf24 0%, #f97316 55%, #c2410c 100%)',
        'space-gradient': 'linear-gradient(180deg, #172033 0%, #0b1120 100%)',
      },
    },
  },
  plugins: [],
};