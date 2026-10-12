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
          50: 'hsl(var(--sapay-50))',
          100: 'hsl(var(--sapay-100))',
          150: 'hsl(var(--sapay-150))',
          200: 'hsl(var(--sapay-200))',
          250: 'hsl(var(--sapay-250))',
          300: 'hsl(var(--sapay-300))',
          350: 'hsl(var(--sapay-350))',
          400: 'hsl(var(--sapay-400))',
          450: 'hsl(var(--sapay-450))',
          500: 'hsl(var(--sapay-500))',
          550: 'hsl(var(--sapay-550))',
          600: 'hsl(var(--sapay-600))',
          650: 'hsl(var(--sapay-650))',
          700: 'hsl(var(--sapay-700))',
          750: 'hsl(var(--sapay-750))',
          800: 'hsl(var(--sapay-800))',
          850: 'hsl(var(--sapay-850))',
          900: 'hsl(var(--sapay-900))',
          950: 'hsl(var(--sapay-950))',
          1000: 'hsl(var(--sapay-1000))',
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
