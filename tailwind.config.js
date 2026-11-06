/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        race: { DEFAULT: '#e10600', 500: '#e10600', 400: '#ff2a1f', 600: '#b30500', glow: '#ff3b30' },
        // tons da landing: azul-noite #0a0e1c e vidro rgba(20,20,30)
        // base escura tingida com a cor do país da etapa (variáveis em src/index.css)
        carbon: { 950: 'color-mix(in srgb, var(--c-950) calc(<alpha-value> * 100%), transparent)', 900: 'color-mix(in srgb, var(--c-900) calc(<alpha-value> * 100%), transparent)', 850: 'color-mix(in srgb, var(--c-850) calc(<alpha-value> * 100%), transparent)', 800: 'color-mix(in srgb, var(--c-800) calc(<alpha-value> * 100%), transparent)', 700: 'color-mix(in srgb, var(--c-700) calc(<alpha-value> * 100%), transparent)', 600: 'color-mix(in srgb, var(--c-600) calc(<alpha-value> * 100%), transparent)', 500: 'color-mix(in srgb, var(--c-500) calc(<alpha-value> * 100%), transparent)' },
        // destaque dinâmico: segue o país da etapa atual/próxima (src/hooks/useEventTheme.tsx)
        gold: {
          DEFAULT: 'color-mix(in srgb, var(--ev-accent) calc(<alpha-value> * 100%), transparent)',
          400: 'color-mix(in srgb, color-mix(in srgb, var(--ev-accent) 80%, white) calc(<alpha-value> * 100%), transparent)',
          600: 'color-mix(in srgb, color-mix(in srgb, var(--ev-accent) 80%, black) calc(<alpha-value> * 100%), transparent)',
        },
        event: {
          1: 'color-mix(in srgb, var(--ev-1) calc(<alpha-value> * 100%), transparent)',
          2: 'color-mix(in srgb, var(--ev-2) calc(<alpha-value> * 100%), transparent)',
          3: 'color-mix(in srgb, var(--ev-3) calc(<alpha-value> * 100%), transparent)',
        },
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
