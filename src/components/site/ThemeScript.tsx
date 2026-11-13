import { THEME_KEYS } from "@/lib/themes";

/**
 * Runs before first paint: resolves the stored theme ("light" | "dark" | "system")
 * against prefers-color-scheme and sets data-theme on <html>. Prevents a flash of the wrong theme.
 */
export function ThemeScript({ defaultMode, preset = "ledger", motion = "full", intro = true }: { defaultMode: "system" | "light" | "dark"; preset?: string; motion?: "full" | "subtle" | "off"; intro?: boolean }) {
  const code = `(function(){try{var d=document.documentElement,s=localStorage.getItem('sco-theme-v2')||(${JSON.stringify(defaultMode)}==='system'?'light':${JSON.stringify(defaultMode)});var q=new URLSearchParams(location.search).get('preset');if(${JSON.stringify(THEME_KEYS)}.indexOf(q)>-1){sessionStorage.setItem('sco-preset',q)}d.dataset.preset=sessionStorage.getItem('sco-preset')||${JSON.stringify(preset)};var r=s==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):s;d.dataset.theme=r;d.dataset.themePref=s;if(${JSON.stringify(motion)}!=='off'&&!matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('motion-ok')}if(${JSON.stringify(!intro)}||sessionStorage.getItem('sco-intro')||!d.classList.contains('motion-ok')){d.dataset.intro='done'}else{sessionStorage.setItem('sco-intro','1')}['gesturestart','gesturechange'].forEach(function(t){document.addEventListener(t,function(e){e.preventDefault()},{passive:false})});}catch(e){document.documentElement.dataset.theme='light'}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
