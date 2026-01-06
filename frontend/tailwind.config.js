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
          background: 'transparent', // Let body gradient show through
          surface: '#ffffff', // White surface for glass effect
          text: '#1e293b', // Slate 800 (Dark text for readability on light/bright bg)
          muted: '#64748b', // Slate 500
          primary: '#12c2e9', // JShine Blue (Navbar/Actions)
          primary_hover: '#0ea5e9', // Darker Blue
          secondary: '#c471ed', // JShine Purple
          accent: '#f64f59', // JShine Red
          border: '#e2e8f0', // Slate 200 (Light border)
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
