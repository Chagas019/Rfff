/** Ícones de traço simples (desenhados aqui, sem biblioteca externa). */
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };

export const IconOrbit = () => (
  <svg viewBox="0 0 24 24" {...base}>
    <ellipse cx="12" cy="12" rx="9" ry="4" />
    <path d="M12 3v18" />
    <path d="M17 14.5l2.5-1.5" />
  </svg>
);
export const IconPlay = () => (
  <svg viewBox="0 0 24 24" {...base}>
    <rect x="3" y="6" width="18" height="12" rx="4" />
    <path d="M8 10v4M6 12h4" />
    <circle cx="15.5" cy="11" r="1" />
    <circle cx="17.5" cy="13.5" r="1" />
  </svg>
);
export const IconAR = () => (
  <svg viewBox="0 0 24 24" {...base}>
    <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
    <path d="M12 7l4 2.3v4.6L12 16l-4-2.1V9.3z" />
    <path d="M8 9.3l4 2.2 4-2.2M12 11.5V16" />
  </svg>
);
export const IconCart = () => (
  <svg viewBox="0 0 24 24" {...base}>
    <path d="M7 3h10v12a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3z" />
    <path d="M9 18v3h6v-3" />
    <circle cx="12" cy="7" r="1.5" />
  </svg>
);
export const IconReset = () => (
  <svg viewBox="0 0 24 24" {...base}>
    <path d="M4 12a8 8 0 1 0 2.4-5.7" />
    <path d="M4 4v4h4" />
  </svg>
);
export const IconFullscreen = () => (
  <svg viewBox="0 0 24 24" {...base}>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </svg>
);
export const IconExitFullscreen = () => (
  <svg viewBox="0 0 24 24" {...base}>
    <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
  </svg>
);
export const IconSound = () => (
  <svg viewBox="0 0 24 24" {...base}>
    <path d="M4 10v4h4l5 4V6L8 10z" />
    <path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11" />
  </svg>
);
export const IconMute = () => (
  <svg viewBox="0 0 24 24" {...base}>
    <path d="M4 10v4h4l5 4V6L8 10z" />
    <path d="M17 10l4 4M21 10l-4 4" />
  </svg>
);
export const IconHelp = () => (
  <svg viewBox="0 0 24 24" {...base}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.4" />
    <circle cx="12" cy="17" r="0.6" fill="currentColor" />
  </svg>
);
export const IconPause = () => (
  <svg viewBox="0 0 24 24" {...base}>
    <path d="M9 6v12M15 6v12" />
  </svg>
);
export const IconClose = () => (
  <svg viewBox="0 0 24 24" {...base}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const IconRotate = ({ dir = 1 }: { dir?: 1 | -1 }) => (
  <svg viewBox="0 0 24 24" {...base} style={{ transform: dir < 0 ? 'scaleX(-1)' : undefined }}>
    <path d="M20 12a8 8 0 1 1-2.4-5.7" />
    <path d="M20 4v4h-4" />
  </svg>
);
export const IconPlus = () => (
  <svg viewBox="0 0 24 24" {...base}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const IconMinus = () => (
  <svg viewBox="0 0 24 24" {...base}>
    <path d="M5 12h14" />
  </svg>
);
export const IconTarget = () => (
  <svg viewBox="0 0 24 24" {...base}>
    <circle cx="12" cy="12" r="7" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);
export const Smiley = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#1d1a16" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
    <path d="M9 9v2.2M15 9v2.2" />
    <path d="M7.8 13.6a4.6 4.6 0 0 0 8.4 0" />
  </svg>
);
