import localFont from 'next/font/local';

// Paragon Social: Geist for the interface text (the export keeps its original
// name so every screen that already uses it picks up the new font)
export const jakartaSans = localFont({
  src: [
    { path: '../paragon/Geist.woff2', weight: '100 900', style: 'normal' },
  ],
  variable: '--font-geist',
});

// Paragon Social: Schibsted Grotesk for titles
export const schibstedGrotesk = localFont({
  src: [
    {
      path: '../paragon/SchibstedGrotesk.woff2',
      weight: '400 900',
      style: 'normal',
    },
  ],
  variable: '--font-heading',
});
