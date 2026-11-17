import localFont from 'next/font/local';

// Inter is bundled from @fontsource so builds never depend on Google Fonts being reachable.
// The "latin" subset covers French (accents, œ, « »).
export const inter = localFont({
  src: '../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2',
  weight: '100 900',
  style: 'normal',
  variable: '--font-inter',
  display: 'swap',
});
