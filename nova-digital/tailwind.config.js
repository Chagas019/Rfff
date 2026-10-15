/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: { DEFAULT: '#030303', 900: '#08080a', 800: '#0e0e12', 700: '#16161c', 600: '#22222a' },
        ink: { DEFAULT: '#f4f4f5', soft: '#a1a1aa', mute: '#71717a', faint: '#3f3f46' },
        volt: { DEFAULT: '#3d7bff', 300: '#8fb4ff', 400: '#5b8fff', 500: '#3d7bff', 600: '#2457d6' },
        amber: { glow: '#ffb547', 300: '#ffd08a', 500: '#ff9f1c' },
      },
      fontFamily: {
        sans: ['"Inter Tight Variable"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: { tightest: '-0.06em' },
      transitionTimingFunction: { expo: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    },
  },
  plugins: [],
};
