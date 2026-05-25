import type { Config } from 'tailwindcss';

const config: Config = {
  // Enable class-based dark mode (Requirement 12.7)
  darkMode: 'class',

  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  theme: {
    extend: {
      // Green primary palette — Requirement 12.1
      colors: {
        primary: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
      },

      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },

      borderRadius: {
        DEFAULT: '0.5rem',
      },

      spacing: {
        // Consistent spacing scale
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
    },
  },

  plugins: [],
};

export default config;
