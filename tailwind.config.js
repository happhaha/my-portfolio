/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: {
          950: '#04060d',
          900: '#070b16',
          850: '#0b1020',
          800: '#111729',
          700: '#1b2338',
          600: '#2a3450',
          500: '#3d4a6b',
          400: '#64719a',
          300: '#98a3c4',
          200: '#c6cee5',
          100: '#e8ecf7',
        },
        aurora: {
          50: '#eef6ff',
          100: '#d9ecff',
          200: '#b6dbff',
          300: '#7cc2ff',
          400: '#3aa4ff',
          500: '#0f86f5',
          600: '#0369d1',
          700: '#0453a8',
          800: '#0a468a',
          900: '#0f3b72',
        },
        plasma: {
          300: '#c4a6ff',
          400: '#a97dff',
          500: '#8b5cf6',
          600: '#7136e8',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Microsoft YaHei',
          'PingFang SC',
          'Hiragino Sans GB',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 40px -12px rgba(58, 164, 255, 0.55)',
        'glow-violet': '0 0 44px -14px rgba(169, 125, 255, 0.6)',
        panel: '0 24px 60px -32px rgba(4, 6, 13, 0.95)',
      },
      backgroundImage: {
        'grid-fade':
          'linear-gradient(to right, rgba(152, 163, 196, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(152, 163, 196, 0.08) 1px, transparent 1px)',
        'hero-glow':
          'radial-gradient(120% 90% at 50% -10%, rgba(58, 164, 255, 0.22) 0%, rgba(139, 92, 246, 0.12) 38%, transparent 72%)',
      },
      backgroundSize: {
        grid: '44px 44px',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(18px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '70%': { transform: 'scale(1.7)', opacity: '0' },
          '100%': { transform: 'scale(1.7)', opacity: '0' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 2.6s linear infinite',
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.3, 0, 0.6, 1) infinite',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
