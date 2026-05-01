/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        green: {
          900: '#1B5E20',
          800: '#2E7D32',
          700: '#388E3C',
          100: '#E8F5E9',
          50:  '#F1F8F2',
        },
        amber: {
          400: '#FFC107',
          300: '#FFD54F',
          100: '#FFF8E1',
        },
      },
      keyframes: {
        shimmer: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
      },
    },
  },
  plugins: [],
};
