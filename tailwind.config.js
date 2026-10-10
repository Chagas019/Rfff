/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        race: { DEFAULT: '#e10600', 500: '#e10600', 400: '#ff2a1f', 600: '#b30500', glow: '#ff3b30' },
        carbon: { 950: '#07070a', 900: '#0d0d12', 850: '#121219', 800: '#181820', 700: '#22222c', 600: '#2e2e3a', 500: '#4a4a58' },
        telemetry: { cyan: '#22d3ee', green: '#22c55e', yellow: '#facc15', purple: '#a855f7' },
      },
      fontFamily: {
        display: ['"Orbitron"', '"Titillium Web"', 'system-ui', 'sans-serif'],
        sans: ['"Titillium Web"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        speedline: { '0%': { transform: 'translateX(120%)', opacity: '0' }, '20%': { opacity: '1' }, '100%': { transform: 'translateX(-120%)', opacity: '0' } },
        scan: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100%)' } },
        dash: { to: { strokeDashoffset: '0' } },
      },
      animation: {
        marquee: 'marquee 40s linear infinite',
        speedline: 'speedline 1.6s linear infinite',
        scan: 'scan 6s linear infinite',
      },
    },
  },
  plugins: [],
};
