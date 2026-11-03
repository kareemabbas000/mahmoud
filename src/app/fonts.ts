import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Sans_Arabic, Markazi_Text } from "next/font/google";

// All SIL Open Font License 1.1 — self-hosted by next/font at build time (no runtime Google requests).
export const markazi = Markazi_Text({
  subsets: ["arabic", "latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-markazi",
  adjustFontFallback: false,
  fallback: ["Amiri", "Georgia", "serif"],
});
export const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-plex-arabic",
  fallback: ["Tahoma", "system-ui", "sans-serif"],
});
export const plex = IBM_Plex_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-plex",
  fallback: ["system-ui", "Segoe UI", "Arial", "sans-serif"],
});
export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-plex-mono",
  preload: false,
});

export const fontVars = `${markazi.variable} ${plexArabic.variable} ${plex.variable} ${plexMono.variable}`;
