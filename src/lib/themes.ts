/**
 * Design themes registry — the one place a theme is declared (docs/ARCHITECTURE.md § Themes).
 *
 * A theme is a set of CSS variables and component overrides scoped to `html[data-preset="<key>"]`.
 * Components never branch on the theme in TypeScript: they use tokens (--blue, --orange, --paper, --ink …)
 * and theme CSS restyles them. To add a theme:
 *   1. add an entry here (key, bilingual name, description, swatches for the panel picker);
 *   2. create src/app/themes/<key>.css with `[data-preset="<key>"] { --blue: …; … }` (+ a dark block
 *      `[data-preset="<key>"][data-theme="dark"]`) and any component overrides;
 *   3. import it at the bottom of src/app/globals.css.
 * The panel (Settings → Appearance), the theme script and types all read this list automatically.
 */
export const THEMES = [
  { key: "ledger", name: ["الأزرق والبرتقالي", "Blue & orange"], description: ["هوية SCO الأصلية: أزرق عميق وبرتقالي", "SCO's own identity: deep blue and orange"], swatches: ["#04019f", "#fc4e08", "#f5f6ff"] },
  { key: "gold", name: ["الذهبي", "Gold"], description: ["فاخر وهادئ: أسود وذهبي وحواف حادة", "Quiet luxury: onyx, gold and sharp edges"], swatches: ["#141310", "#b08d57", "#fbf7ee"] },
] as const satisfies readonly { key: string; name: readonly [string, string]; description: readonly [string, string]; swatches: readonly string[] }[];

export type ThemeKey = (typeof THEMES)[number]["key"];
export const THEME_KEYS = THEMES.map((t) => t.key) as ThemeKey[];
export const DEFAULT_THEME: ThemeKey = "ledger";
export const isTheme = (v: unknown): v is ThemeKey => typeof v === "string" && (THEME_KEYS as string[]).includes(v);
