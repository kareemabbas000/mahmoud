# Content map: sco-eg.com → new SCO site

**Crawled:** 3 Nov 2026, using headless Chromium for both languages plus the WordPress REST API.
**Verbatim source of truth:** [`content/inventory.json`](../content/inventory.json). It holds every block of text on every real page in both AR and EN, plus headings, images, SEO tags, iframes, FAQs, clients, team and the media library.
**Assets:** [`content/legacy-assets/`](../content/legacy-assets) holds 50 files, all owned by SCO. Theme demo stock is not copied over (see §6).
**Redirects:** [`content/redirects.json`](../content/redirects.json) holds 70 rules, all returning 301.
**Crawler scripts:** [`scripts/legacy/`](../scripts/legacy). These are reproducible: `crawl.js`, `extract.py`, `dl.js`, `build_inventory.py`.

---

## 1. How the old site is built

| | |
|---|---|
| Platform | WordPress 5.4, Themesflat theme, WPBakery, Slider Revolution, Photo Gallery, Quform |
| Languages | English is the WordPress source at `/`. Arabic is a translation layer at `/ar/` with the same page IDs, so the Arabic has no content of its own in the CMS. |
| Built by | MyCairo (mycairo.net), © 2021 |
| Content age | No updates since 2021 (the "16 years of success" claim was written in 2021) |
| Blog | Only theme Lorem Ipsum posts. There are no real articles. |

## 2. Site map: old → new

All new URLs exist in both languages, `/ar/…` and `/en/…`. Arabic is the default.

| Old AR | Old EN | New path | New page |
|---|---|---|---|
| `/ar/` | `/` | `/` → `/{locale}` | Home |
| `/ar/company-profile/` | `/company-profile/` | `/about` | About: story, values, philosophy |
| `/ar/our-services/` | `/our-services/` | `/services` | Services index |
| `/ar/finance-auditing/` | `/finance-auditing/` | `/services/external-audit` | Service detail |
| `/ar/accounting-services/` | `/accounting-services/` | `/services/accounting` | Service detail |
| `/ar/establishing-companies/` | `/establishing-companies/` | `/services/company-formation` | Service detail |
| `/ar/feasibility-studies/` | `/feasibility-studies/` | `/services/feasibility-studies` | Service detail |
| `/ar/project-financing/` | `/project-financing/` | `/services/project-finance` | Service detail |
| `/ar/tax-services/` | `/tax-services/` | `/services/tax` | Service detail |
| `/ar/functional-structure/` | `/functional-structure/` | `/team` | Leadership and team |
| `/ar/mahmoud-al-sheikh/` | `/mahmoud-al-sheikh/` | `/team/mahmoud-al-sheikh` | Founder profile |
| `/ar/our-clients/` | `/our-clients/` | `/clients` | Clients, donors and NGOs |
| `/ar/faqs/` | `/faqs/` | `/faq` | Tax FAQ (with FAQPage rich results) |
| `/ar/gallery/` | `/gallery/` | `/gallery` | Gallery |
| `/ar/careers/` | `/careers/` | `/careers` | Careers and CV upload |
| `/ar/contact-us-2/` | `/contact-us-2/` | `/contact` | Contact: form, map, WhatsApp, `tel:` |
| `/ar/blog/` and demo posts | `/blog/` and demo posts | `/insights` | Insights (new, empty until the firm publishes) |
| `/privacy-policy/` (404 today) | | `/privacy`, `/terms` | New. The text needs the firm's approval (see open questions). |

## 3. Page-by-page inventory

The full verbatim text for every page is in `inventory.json` → `pages[]`, as `ar.blocks` and `en.blocks`.

**SEO on the legacy site:** none of the pages has a meta description, Open Graph tags or hreflang. Titles follow the pattern `<Page> – SCO`. The new site writes a proper title and description for every page in both languages.

### Home (`/ar/`, `/`)
1. **Hero slider** (Revolution Slider): "الدعم / إحداث فارق" with "دور فريق العمل الخاص بك هو تشكيل و تصميم الخدمة ذات الجودة العالية…". In English: "SYNERGY / Making A Difference". Has a "Contact us" call to action. The background is theme stock.
2. **About teaser**: "16 عام من النجاح / 16 Years Of Success", the founding paragraph (2005, scope of services), and a video thumbnail that links to YouTube `3xzxlWo8TGc`.
3. **Services intro**: "نحن نساعد المنظمات على العمل بشكل أكثر ذكاءً… / We help organisations work smarter…"
4. **Services grid**: six cards, each with an orange line icon, an excerpt and a "Read more" link.
5. **Why SCO**: four counters plus the line "تمكنا من مساعدة المئات… / We were able to help hundreds…". The values are not consistent; see the open questions.
6. **Clients carousel**: nine client logos.
7. **Footer**: address, two mobiles, two landlines, email, service links, Google Map, and Facebook/LinkedIn/Twitter icons (only Facebook has a real link).
8. **Floating widget**: WhatsApp (+20 101 049 4857), Messenger and Facebook.

### About / Company Profile
Covers: "16 years of success", the founding paragraph, Why us, the five core values, the integrity statement (which names the firm as "محمود الشيخ وشركاؤه"), and six feature tiles (Synergy, Diversity, Our office / locations, Philosophy, Our goal, International strength). It ends with the counters (placeholder values) and the map.
*The English and Arabic versions are different texts, not translations of each other. The English "Why you choose us" paragraph is a proposal letter. Both are in the inventory.*

### Services (6 detail pages)
| Service | Content |
|---|---|
| Finance Auditing / المراجعة المالية | AAA definition of audit; work under ISA and the Egyptian Standards on Auditing; scope (test review, policies and provisions, presentation and disclosures, interim review of internal controls, management letter); year-end work (5 items) |
| Accounting Services / الخدمات المحاسبية | Setting up accounting systems, bookkeeping, bank and credit reconciliations, inventory reconciliations, financial statements, KPIs, tax returns, payroll and social insurance |
| Establishing Companies / تأسيس الشركات | 8 items: all company forms, foreign branches and representative offices; corporate affairs advice; change of legal form; mergers, demergers and liquidation; registrations (commercial register, industrial register, FRA, EGX, commercial agents, importers/exporters, leasing, contractors' federation); articles of association, contracts and governance records; work and residence permits; licences |
| Feasibility Studies / دراسات الجدوى | Purpose, then the phases: market study (6), technical study (6), financial study (2), financial and economic indicators, project evaluation |
| Project Financing / تمويل المشروع | Banks and private funds, private investors and partners, investment funds, cash management and monitoring |
| Tax Services / خدمات ضريبية | Tax examination ("more than 25 years" relationship with tax offices); preparing and filing returns (income tax, VAT, withholding, stamp duty, payroll tax); tax advisory |

**Services the "about" text mentions that have no page of their own:** financial and administrative consulting, HR, legal advice, establishing universities and schools, NGOs, restructuring, strategic plans, judicial receivership, liquidation, zakat, and IT consulting. They are listed in `inventory.services_mentioned_without_page`. Whether each one gets its own page is an open question.

### Functional Structure → Team
Six people, each with an Arabic and English name, role and credentials:
1. Mahmoud M. Abdel-Halim Al-Sheikh: owner and founder, chartered accountant and tax expert, four memberships
2. Hamdy Mousharafa: tax partner. *The legacy site shows a "TAX" placeholder instead of a photo.*
3. Dr. Shaaban Abdel Gayied: head of financial advisory and feasibility studies
4. Taha Ali Abdel Hafeez: office executive director. *The legacy site shows a cartoon avatar.*
5. Hossam Shaaban Abdel Gayied: director of operations
6. Hany Ali Abdel Karim: audit (review) manager

### Mahmoud Al-Sheikh profile
- The Arabic page has certifications, previous work and current work.
- The English page also has "personal data" (date of birth, degree: B.Com Accounting, Ain Shams 1999).
- Registration numbers: Accountants and Auditors Register **21145**, Egyptian Tax Association **8385** (2012), Egyptian Association for Public Finance and Taxes **2262** (2010).
- Career history: 2001–05 Amr Ali & Co.; 2005–07 Mohamed El-Galaly & Co.; 2007–12 head of tax at Nasr Abu El-Abbas & Co.
- Trainer certifications: Herotec, Wesal Academy.

### Clients
- 26 corporate clients, of which 8 have logos.
- 1 client appears only as a logo: Alpha Centers Group.
- 12 donors and development agencies: World Bank, GIZ, USAID, UNHCR, Plan International, Save the Children, Barclays, Banque Misr, Misr El Kheir, Drosos and others.
- 13 NGOs and foundations.
- Two collage images.

### FAQ
There are 30 Q&As about salary and payroll tax under Law 91/2005. They are all verbatim in `inventory.faqs`. Several English questions are mistranslated; Q1 in particular is garbled.

### Gallery
11 photos with Arabic captions only: events, MoU signings, client meetings, the GIZ programme in Sohag, the Swedish ambassador and others.

### Careers
A form only: name, mobile, email, job title, CV upload and captcha. No vacancies are listed.

### Contact
Address, mobiles, landlines, email, a form (name, mobile, message and captcha) and the map.

## 4. Contact data (canonical)

| | |
|---|---|
| Address AR | 92 عبد العزيز فهمى، النزهة، محافظة القاهرة، مصر. بجوار قسم شرطة النزهة، وقريب من محطة مترو هليوبوليس |
| Address EN | 92 Abdel Aziz Fahmy St., El Nozha, Cairo, Egypt. Next to El Nozha police station, near Heliopolis metro station |
| Map | 30.107487, 31.337956 |
| Mobiles | +20 101 131 5442 · +20 100 104 6442 |
| Landlines | +20 2 2082 4165 · +20 2 2082 4409 |
| WhatsApp | +20 101 049 4857 |
| Email | info@sco-eg.com |
| Facebook / Messenger | facebook.com/MahmmoudElshekh · m.me/MahmmoudElshekh |
| YouTube | youtube.com/watch?v=3xzxlWo8TGc (office video) |
| Working hours | **Not stated anywhere.** See the open questions. |

## 5. Asset catalogue (`content/legacy-assets/`)

| Folder | Files | Notes |
|---|---|---|
| `brand/` | AR logo (255×113), two EN logos (300×125, 270×113), favicon (380×380) | **No SVG and only low resolution.** A vector redraw is planned (see the open questions). Colours: blue `#04019F`, orange `#FC4E08`. |
| `clients/` | 9 logos at 93×93, 4 collages | Low resolution; we need originals |
| `team/` | 4 real framed portraits, the founder cut-out in two sizes, 2 placeholders, 1 unconfirmed portrait | The portraits are baked into a white "picture frame" mock-up, so they need re-cropping |
| `service-icons/` | 6 orange line icons at 70px | To be replaced by a consistent SVG icon set in the brand style |
| `office/` | 3D office render (several crops), video poster, "goal" banner | The render shows an SCO-branded meeting room |
| `gallery/` | 11 originals (720–1280px, plus one tall screenshot) | Filenames are ASCII; captions are in the inventory |

**Not copied (catalogued in `inventory.media_library` as `theme-demo-stock`):** 80+ images from 2017–2018 that ship with the Themesflat theme demo (sliders, parallax backgrounds, fake team photos). They are not SCO's, and we cannot assume their licence covers reuse. The new site uses its own art direction instead.

**Not published:** `Mahmoud-Al-Sheikh-CV.pdf`. It contains personal data (date of birth, religion, home address and personal email) and nothing on the old site links to it. It will be uploaded to private Supabase storage, and its URL 301-redirects to the founder profile.

## 6. Weaknesses on the legacy site (to fix)

1. **Another firm's name in the copy.** The Arabic tax page says "مكتب ابوالوفا للنظم المالية والادارية". The English profile says "AHS, Ahmed Hassan El Sayed Chartered Accountants". Both are template leftovers.
2. **Machine-translated English**, for example "money companies", "Registration and registration", "legal guard services", "Herotic", "S. aid.", "Caffeine", "Whoever lives it up for services", and FAQ Q1. It will be rewritten in native professional English.
3. **Inconsistent statistics** across pages and languages: AR shows 2742 services, EN shows 5742, and the inner pages show placeholder values such as 1 year and 30 clients. The years counter shows 16 or 2. The labels are also swapped in EN ("Consultants 5149" versus AR "Consultations").
4. **Stale "16 years".** The firm was founded in 2005, so in 2026 that is 21 years. The new site will compute it from the founding year.
5. **Outdated legal content.** The FAQ and tax pages cite Law 91/2005 with thresholds that have since been amended.
6. **No SEO metadata** (no descriptions, OG tags, hreflang or valid sitemap) and a broken sitemap reference in robots.txt.
7. **Theme demo pollution**: a Lorem Ipsum blog, fake team pages ("Our Team Style 01/02") and a dead privacy-policy link.
8. **Accessibility**: images have no alt text, the client logos are labelled "images", and the counters show 0 until they animate.
9. **Mixed phone formats and two addresses** (El Nozha and Nasr City).
10. **Heavy page weight**: Revolution Slider, WPBakery and many plugin scripts. mod_security blocks non-browser user agents (HTTP 406).
11. **Team photos** are placeholders or inside frame mock-ups, and the English page drops the "Dr." title.
12. **The Arabic and English versions diverge.** Different paragraphs appear on the About page, and the founder's personal data appears only in English.
