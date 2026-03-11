import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bistro: {
          50: '#f8f7f5',
          100: '#efece8',
          500: '#8d6e63',
          700: '#5d4037',
          900: '#3e2723',
        },
      },
    },
  },
  plugins: [],
};

export default config;
