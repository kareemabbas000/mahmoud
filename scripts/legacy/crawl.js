const { chromium } = require('playwright'); const fs = require('fs');
const seeds = ['', 'company-profile','our-services','finance-auditing','accounting-services','establishing-companies','feasibility-studies','project-financing','tax-services','functional-structure','mahmoud-al-sheikh','careers','our-clients','faqs','gallery','contact-us-2','our-team-style-01','our-team-style-02','blog','privacy-policy'];
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  const queue = []; const seen = new Set(); const found = new Set();
  for (const s of seeds) for (const l of ['ar/', '']) queue.push(`https://sco-eg.com/${l}${s}${s ? '/' : ''}`);
  const results = [];
  while (queue.length) {
    const u = queue.shift(); if (seen.has(u)) continue; seen.add(u);
    let r; try { r = await p.goto(u, { waitUntil: 'networkidle', timeout: 90000 }); } catch (e) { console.log('ERR', u, e.message); continue; }
    await p.waitForTimeout(800);
    // scroll to trigger lazy/animations
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } window.scrollTo(0,0); });
    const data = await p.evaluate(() => {
      const meta = n => document.querySelector(`meta[name="${n}"],meta[property="${n}"]`)?.content || null;
      const main = document.querySelector('#main-content, #content, .site-content, main') || document.body;
      const heads = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => ({ tag: h.tagName, text: h.innerText.trim() })).filter(h => h.text);
      // text blocks in DOM order from content area
      const blocks = []; const walker = main.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,blockquote,td,th,.counter,.numb-count,dt,dd,label,button,span.title,div.title');
      const seenT = new Set();
      for (const el of walker) { const t = (el.innerText || '').trim().replace(/\s+\n/g, '\n'); if (!t || seenT.has(t) || t.length > 5000) continue; if ([...el.children].some(c => /^(P|LI|H\d)$/.test(c.tagName))) continue; seenT.add(t); blocks.push({ tag: el.tagName, text: t }); }
      const imgs = [...document.querySelectorAll('img')].map(i => ({ src: i.currentSrc || i.src, srcset: i.getAttribute('srcset'), alt: i.alt, w: i.naturalWidth, h: i.naturalHeight }));
      const bgs = [...document.querySelectorAll('*')].map(e => getComputedStyle(e).backgroundImage).filter(x => x && x.startsWith('url(')).map(x => x.slice(5, -2));
      const links = [...document.querySelectorAll('a[href]')].map(a => ({ href: a.href, text: a.innerText.trim() }));
      const iframes = [...document.querySelectorAll('iframe')].map(f => f.src);
      const altLinks = [...document.querySelectorAll('link[rel=alternate][hreflang]')].map(l => ({ hreflang: l.hreflang, href: l.href }));
      return { url: location.href, lang: document.documentElement.lang, dir: document.documentElement.dir, title: document.title, description: meta('description'), og: { title: meta('og:title'), description: meta('og:description'), image: meta('og:image') }, canonical: document.querySelector('link[rel=canonical]')?.href || null, altLinks, heads, blocks, imgs, bgs: [...new Set(bgs)], links, iframes, bodyText: document.body.innerText };
    });
    data.status = r.status(); data.requested = u;
    const key = (u.replace('https://sco-eg.com/', '').replace(/\/$/, '').replace(/\//g, '__') || 'home_en');
    fs.writeFileSync(`crawl/html/${key}.html`, await p.content());
    fs.writeFileSync(`crawl/json/${key}.json`, JSON.stringify(data, null, 1));
    await p.screenshot({ path: `crawl/shots/${key}.png`, fullPage: true });
    console.log(r.status(), u, data.title, data.blocks.length);
    for (const l of data.links) { try { const x = new URL(l.href); x.hash = ''; const h = x.href; if (/sco-eg\.com$/.test(x.hostname)) { found.add(h); if (!/wp-content|wp-admin|\.(pdf|jpe?g|png|zip|docx?)$|feed|xmlrpc|\?/.test(h) && !seen.has(h)) queue.push(h); } } catch {} }
  }
  fs.writeFileSync('crawl/all_links.json', JSON.stringify([...found].sort(), null, 1));
  await b.close();
})();
