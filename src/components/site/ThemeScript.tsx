/**
 * Runs before first paint: resolves the stored theme ("light" | "dark" | "system")
 * against prefers-color-scheme and sets data-theme on <html>. Prevents a flash of the wrong theme.
 */
export function ThemeScript({ defaultMode, preset = "ledger" }: { defaultMode: "system" | "light" | "dark"; preset?: string }) {
  const code = `(function(){try{var d=document.documentElement,s=localStorage.getItem('sco-theme-v2')||(${JSON.stringify(defaultMode)}==='system'?'light':${JSON.stringify(defaultMode)});var q=new URLSearchParams(location.search).get('preset');if(q==='gold'||q==='ledger'){sessionStorage.setItem('sco-preset',q)}d.dataset.preset=sessionStorage.getItem('sco-preset')||${JSON.stringify(preset)};var r=s==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):s;d.dataset.theme=r;d.dataset.themePref=s;if(!matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('motion-ok')}if(sessionStorage.getItem('sco-intro')||!d.classList.contains('motion-ok')){d.dataset.intro='done'}else{sessionStorage.setItem('sco-intro','1')}}catch(e){document.documentElement.dataset.theme='light'}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
