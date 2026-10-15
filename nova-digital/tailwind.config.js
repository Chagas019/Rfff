/** @type {import('tailwindcss').Config} */
// Sistema visual ORYZO Darkroom: canvas walnut, texto cream, bark como superfície elevada,
// cork/driftwood para estrutura e ember apenas para destaques editoriais.
const cream = '#ffedd7';
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // canvas (walnut shadow) e superfície elevada (bark brown)
        void: { DEFAULT: '#100904', 900: '#100904', 800: '#382416', 700: '#382416', 600: '#40372e' },
        ink: { DEFAULT: cream, soft: '#cdbba6', mute: '#9a8b7a', faint: '#40372e' },
        // tons estruturais (antes "volt"): cream → driftwood → cork
        volt: { DEFAULT: '#6c5f51', 300: cream, 400: '#cdbba6', 500: '#6c5f51', 600: '#40372e' },
        // ember: só para créditos e frases curtas em destaque
        amber: { glow: '#dc5000', 300: '#f0a070', 500: '#dc5000' },
        walnut: '#100904',
        bark: '#382416',
        cork: '#40372e',
        driftwood: '#6c5f51',
        ember: '#dc5000',
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        // rótulos usam a mesma família, em caixa alta e peso 500
        mono: ['"Inter Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: { card: '12px', ghost: '22.5px', pill: '36px' },
      transitionTimingFunction: { expo: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    },
  },
  plugins: [],
};
