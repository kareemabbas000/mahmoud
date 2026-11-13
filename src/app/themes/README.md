# Themes

One CSS file per design theme, imported at the end of `src/app/globals.css`.
Register every theme in `src/lib/themes.ts` first (key, names, swatches).

```css
/* src/app/themes/<key>.css */
[data-preset="<key>"] { --blue: …; --blue-2: …; --blue-wash: …; --orange: …; --orange-text: …; --paper: …; --ink: …; }
[data-preset="<key>"][data-theme="dark"] { /* dark-mode values */ }
[data-preset="<key>"] .btn { /* optional component overrides */ }
```

Rules: style through tokens, never fork components; keep contrast AA in both modes; no `backdrop-filter`/animated blur (docs/GUARDRAILS.md §7).
The original `gold` theme still lives inside `globals.css` (search `[data-preset="gold"]`); new themes go here.
