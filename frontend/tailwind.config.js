/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          background: '#264653', // Charcoal (New Bg)
          surface: '#ffffff', // Keep white surface for contrast or maybe adjust? keeping white for now
          text: '#ffffff', // White
          muted: '#cbd5e1',
          primary: '#2A9D8F', // Teal
          primary_hover: '#248a7d', // Darker Teal
          secondary: '#E9C46A', // Yellow
          accent: '#F4A261', // Orange
          danger: '#E76F51', // Red/Salmon
          border: '#e2e8f0',
        }
      },
    },
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
      mono: ['Fira Code', 'monospace'],
      hand: ['Caveat', 'cursive'], // Fun font for "stickers" or accents if needed
    },
    animation: {
      'float-slow': 'float 8s ease-in-out infinite',
      'float-medium': 'float 6s ease-in-out infinite',
      'float-fast': 'float 4s ease-in-out infinite',
      'spin-slow': 'spin 12s linear infinite',
      'bounce-slow': 'bounce 3s infinite',
    },
    keyframes: {
      float: {
        '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
        '50%': { transform: 'translateY(-20px) rotate(5deg)' },
      }
    },
    backgroundImage: {
      backgroundImage: {
        'gradient-main': 'linear-gradient(to top, #30cfd0 0%, #330867 100%)',
      }
    }
  },
  plugins: [],
}
