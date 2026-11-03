import { Alexandria, IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Sans_Arabic } from "next/font/google";

// All SIL Open Font License 1.1 — self-hosted by next/font at build time (no runtime Google requests).
// Display: Alexandria — geometric, straight-stroke Arabic + Latin (Mohamed Gaber, OFL). Variable weight axis.
export const alexandria = Alexandria({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-alexandria",
  fallback: ["IBM Plex Sans Arabic", "Tahoma", "system-ui", "sans-serif"],
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

export const fontVars = `${alexandria.variable} ${plexArabic.variable} ${plex.variable} ${plexMono.variable}`;
