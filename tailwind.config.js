/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fbf8ee',
          100: '#f6eed6',
          200: '#eddcaa border',
          300: '#e0c47b',
          400: '#d4af37', // Luxury Royal Gold
          500: '#c5a059', // Champagne Gold Accent
          600: '#a88140',
          700: '#876233',
          800: '#704f2d',
          900: '#5e4129',
        },
        ivory: {
          50: '#ffffff',
          100: '#faf9f6', // Core Ivory Background
          200: '#f7f3e9', // Soft Champagne
          300: '#f5f0eb', // Warm Beige
          400: '#efece6', // Soft Sand
          500: '#e5e0d8',
        },
        onyx: {
          950: '#0c0c0d',
          900: '#151517',
          800: '#222225',
          700: '#333338',
          600: '#4d4d54',
          500: '#6b6b75',
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
    },
  },
  plugins: [],
};
