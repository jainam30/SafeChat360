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
          background: '#F0F4F8', // Soft Blue-Grey Light BG
          surface: '#FFFFFF', // Clean White Surface
          text: '#1E293B', // Slate 800 (Dark Grey for text)
          muted: '#64748B', // Slate 500
          primary: '#6366F1', // Indigo 500 (Vibrant, Friendly)
          primary_hover: '#4F46E5', // Indigo 600
          secondary: '#10B981', // Emerald 500 (Success)
          accent: '#F43F5E', // Rose 500 (Alerts)
          border: '#E2E8F0', // Slate 200 (Subtle Borders)
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
      'gradient-light': 'linear-gradient(135deg, #F0F4F8 0%, #E0E7FF 100%)',
    }
  },
  plugins: [],
}
