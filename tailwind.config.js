/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores neon del proyecto original
        neon: {
          cyan: '#4deeea',
          magenta: '#f000ff',
          yellow: '#FFFF00',
        },
        // Tema oscuro base
        dark: {
          900: '#0a0a0a',
          800: '#1a1a1a',
          700: '#2a2a2a',
          600: '#3c3735',
        }
      },
      fontFamily: {
        museo: ['MuseoModerno', 'cursive'],
        oswald: ['Oswald', 'sans-serif'],
        josefin: ['Josefin Sans', 'sans-serif'],
      },
      animation: {
        'stroke-draw': 'strokeDraw 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        strokeDraw: {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { filter: 'drop-shadow(0 0 5px currentColor)' },
          '50%': { filter: 'drop-shadow(0 0 20px currentColor)' },
        },
      },
    },
  },
  plugins: [],
}
