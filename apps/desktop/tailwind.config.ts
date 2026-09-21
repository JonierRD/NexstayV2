import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        sapay: {
          50: '#fffaf5',
          100: '#fcfaf8',
          150: '#fcf7f1',
          200: '#faf6f2',
          250: '#f6f1eb',
          300: '#ece0d7',
          350: '#eadfd6',
          400: '#e0d4ca',
          450: '#dccfca',
          500: '#bfa89d',
          550: '#a49486',
          600: '#b08f7c',
          650: '#8d7b70',
          700: '#7d6e63',
          750: '#7d6d61',
          800: '#6b3a2d',
          850: '#5a3429',
          900: '#4b2b21',
          950: '#2b1b14',
          1000: '#24140f',
          neutral: {
            100: '#d9d9d9',
            200: '#9a9a9a',
            300: '#8b8b8b'
          }
        },
        success: {
          DEFAULT: '#2f8f4e',
          50: '#e9f6eb',
          100: '#c6e8cf'
        },
        danger: {
          DEFAULT: '#c94a43',
          50: '#fff0ee',
          100: '#fff0f0',
          150: '#f0c8c4',
          200: '#f1c2c2'
        },
        gold: {
          DEFAULT: '#c78b14'
        }
      }
    }
  },
  plugins: []
} satisfies Config;
