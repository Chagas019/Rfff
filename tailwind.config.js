/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        race: { DEFAULT: '#e10600', 500: '#e10600', 400: '#ff2a1f', 600: '#b30500', glow: '#ff3b30' },
        // tons da landing: azul-noite #0a0e1c e vidro rgba(20,20,30)
        carbon: { 950: '#0a0e1c', 900: '#0e1324', 850: '#121829', 800: '#161c2e', 700: '#20273b', 600: '#2c3449', 500: '#4a5268' },
        gold: { DEFAULT: '#EDB40B', 400: '#f5c63a', 600: '#c99608' },
        f1: { dark: 'rgb(41,41,41)', yellow: 'rgb(237,180,11)' },
        telemetry: { cyan: '#22d3ee', green: '#22c55e', yellow: '#EDB40B', purple: '#a855f7' },
      },
      fontFamily: {
        // Albert Sans em tudo, como na landing
        display: ['"Albert Sans"', 'sans-serif'],
        condensed: ['"Albert Sans"', 'sans-serif'],
        sans: ['"Albert Sans"', 'system-ui', 'sans-serif'],
        albert: ['"Albert Sans"', 'sans-serif'],
        mono: ['"Albert Sans"', 'ui-monospace', 'monospace'],
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
