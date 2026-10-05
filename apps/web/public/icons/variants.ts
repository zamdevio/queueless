/* Icon candidates — pick one, copy over public/icons/icon.svg */

/* Variant A: current — gradient Q + green status dot */
/* See icon.svg */

/* Variant B: queue bars (three lines + arrow) */
export const ICON_B = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#2563eb"/><stop offset="100%" stop-color="#7c3aed"/>
  </linearGradient></defs>
  <rect width="512" height="512" rx="96" fill="url(#g)"/>
  <rect x="120" y="140" width="200" height="36" rx="18" fill="#fff" opacity="0.95"/>
  <rect x="120" y="238" width="160" height="36" rx="18" fill="#fff" opacity="0.7"/>
  <rect x="120" y="336" width="120" height="36" rx="18" fill="#fff" opacity="0.45"/>
  <circle cx="380" cy="354" r="36" fill="#10b981"/>
  <path d="M364 354l12 12 22-24" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

/* Variant C: ticket */
export const ICON_C = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#2563eb"/><stop offset="100%" stop-color="#7c3aed"/>
  </linearGradient></defs>
  <rect width="512" height="512" rx="96" fill="url(#g)"/>
  <rect x="110" y="170" width="292" height="172" rx="24" fill="#fff"/>
  <circle cx="140" cy="256" r="22" fill="url(#g)"/>
  <circle cx="372" cy="256" r="22" fill="url(#g)"/>
  <text x="256" y="278" text-anchor="middle" font-family="system-ui,sans-serif" font-size="64" font-weight="800" fill="#0a0a0a">Q</text>
</svg>`;
