const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const urls = JSON.parse(fs.readFileSync(process.argv[2]));
  const b = await chromium.launch(); const ctx = await b.newContext(); const p = await ctx.newPage();
  await p.goto('https://sco-eg.com/ar/', { waitUntil: 'domcontentloaded' });
  for (const u of urls) {
    const rel = u.replace(/^https?:\/\/sco-eg\.com\/(ar\/)?wp-content\/uploads\//, '');
    const out = path.join('media', rel); if (fs.existsSync(out)) continue;
    fs.mkdirSync(path.dirname(out), { recursive: true });
    try { const r = await ctx.request.get(u, { timeout: 60000 }); if (r.ok()) { fs.writeFileSync(out, await r.body()); console.log('ok', rel); } else console.log('FAIL', r.status(), rel); } catch (e) { console.log('ERR', rel, e.message); }
  }
  await b.close();
})();
