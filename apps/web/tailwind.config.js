/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/shared/src/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        outerBg: '#E7E4EA',
        appPanel: '#F2EFF5',
        card: '#FFFFFF',
        innerSoftArea: '#F2EFF5',
        accentOrange: '#E8593A',
        orangeTint: '#FDE6DF',
        blackPill: '#151218',
        textPrimary: '#151218',
        textSecondary: '#55505A',
        yolBorder: '#E7E4EA',
        toggleOff: '#D9D6DD',
        
        statusSuccess: '#1F7A4D',
        statusSuccessBg: '#E3F4EA',
        statusWarning: '#9A5B00',
        statusWarningBg: '#FFF1D6',
        statusDanger: '#B42318',
        statusDangerBg: '#FDE8E6',

        darkOuter: '#0E0C10',
        darkPanel: '#151218',
        darkCard: '#1C191F',
        darkText: '#FFFFFF',
        darkTextSec: '#A59FA9',
        darkBorder: '#2C2833'
      },
      borderRadius: {
        'panel': '32px',
        'card': '24px',
        'inner': '16px'
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 8px 30px rgba(0, 0, 0, 0.04)',
        'float': '0 12px 36px rgba(0, 0, 0, 0.08)'
      }
    },
  },
  plugins: [],
};
