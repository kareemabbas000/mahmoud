import json, sys, re, os
from bs4 import BeautifulSoup
crawl = sys.argv[1]
def blocks(fname):
    s = BeautifulSoup(open(os.path.join(crawl, 'html', fname + '.html')).read(), 'html.parser')
    m = s.select_one('main') or s.body
    for t in m.select('script,style,form,iframe,.vc_toggle,.themesflat_counter,noscript'): t.decompose()
    out = []
    for el in m.find_all(['h1','h2','h3','h4','h5','h6','p','li']):
        if el.find_parent('li') and el.name != 'li': continue
        if el.name == 'p' and el.find_parent('li'): continue
        t = re.sub(r'[ \t ]+', ' ', el.get_text(' ', strip=True)).strip()
        if not t: continue
        out.append({'type': 'heading' if el.name[0] == 'h' else ('item' if el.name == 'li' else 'p'), 'level': int(el.name[1]) if el.name[0] == 'h' else None, 'text': t})
    # dedupe consecutive
    ded = []
    for b in out:
        if ded and ded[-1]['text'] == b['text']: continue
        ded.append(b)
    return ded
pages = {}
for f in sorted(os.listdir(os.path.join(crawl, 'json'))):
    k = f[:-5]
    d = json.load(open(os.path.join(crawl, 'json', f)))
    pages[k] = {'url': d['url'], 'status': d['status'], 'lang': d['lang'], 'dir': d['dir'], 'title': d['title'], 'meta_description': d['description'], 'og': d['og'], 'canonical': d['canonical'], 'headings': d['heads'],
                'images': sorted({i['src'] for i in d['imgs'] if not i['src'].startswith('data:')}), 'background_images': d['bgs'], 'iframes': d['iframes'], 'blocks': blocks(k)}
json.dump(pages, open(sys.argv[2], 'w'), ensure_ascii=False, indent=1)
print(len(pages))
