/**
 * Runs before first paint: resolves the stored theme ("light" | "dark" | "system")
 * against prefers-color-scheme and sets data-theme on <html>. Prevents a flash of the wrong theme.
 */
export function ThemeScript({ defaultMode }: { defaultMode: "system" | "light" | "dark" }) {
  const code = `(function(){try{var d=document.documentElement,s=localStorage.getItem('sco-theme')||${JSON.stringify(defaultMode)};var r=s==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):s;d.dataset.theme=r;d.dataset.themePref=s;if(!matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('motion-ok')}}catch(e){document.documentElement.dataset.theme='light'}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
