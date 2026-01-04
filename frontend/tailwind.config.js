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
          background: '#141E30', // Midnight Blue BG
          surface: '#1E2B45', // Lighter Navy Surface
          text: '#F8FAFC', // Near White Text
          muted: '#94A3B8', // Slate 400 Muted Text
          primary: '#3F5E96', // Royal Blue Primary
          primary_hover: '#2D4A80', // Darker Royal Blue
          secondary: '#10B981', // Emerald 500 (Success)
          accent: '#F43F5E', // Rose 500 (Alerts)
          border: '#2D3A52', // Darker Border
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
        'gradient-main': 'linear-gradient(135deg, #141E30 0%, #3F5E96 100%)',
      }
    }
  },
  plugins: [],
}
