import type { RichDoc, RichNode } from "@/lib/types";

/**
 * Content analyser for the post editor: SEO and readability checks with plain-language advice.
 * Arabic-aware: diacritics, alef/yeh/teh-marbuta variants and tatweel are normalised before matching.
 */

export type Level = "good" | "ok" | "bad";
export type Check = { id: string; group: "seo" | "read"; level: Level; label: [string, string]; tip?: [string, string] };
export type Analysis = { seo: number; read: number; checks: Check[]; stats: Stats };
export type Stats = {
  words: number;
  sentences: number;
  paragraphs: number;
  avgSentence: number;
  longSentencePct: number;
  h2: number;
  h3: number;
  internal: number;
  external: number;
  images: number;
  imagesNoAlt: number;
  density: number;
  occurrences: number;
};

export type AnalyzeInput = {
  locale: string;
  title: string;
  seoTitle: string;
  description: string;
  slug: string;
  focus: string;
  excerpt: string;
  doc: RichDoc | null | undefined;
  cover: string | null;
  coverAlt: string;
  siteHost?: string;
  otherFocus?: string[];
  /** Secondary keyphrases (synonyms, related searches). */
  keywords?: string[];
};

export const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[ً-ٰٟـ]/g, "") // tashkeel, superscript alef, tatweel
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const words = (s: string) => norm(s).split(" ").filter(Boolean);

/** Count phrase occurrences on word boundaries (also matches Arabic with a prefixed ال/و/ب/ل/ف). */
export function countPhrase(text: string, phrase: string) {
  const t = ` ${norm(text)} `;
  const p = norm(phrase);
  if (!p) return 0;
  const esc = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(?<=[\\s])(?:و|ف|ب|ل|ك)?(?:ال)?${esc}(?=[\\s])`, "gu");
  return (t.match(re) ?? []).length;
}
const has = (text: string, phrase: string) => countPhrase(text, phrase) > 0;

type Walk = { paras: string[]; heads: { level: number; text: string }[]; links: string[]; images: { alt: string }[]; text: string[] };

function walk(doc: RichDoc | null | undefined): Walk {
  const w: Walk = { paras: [], heads: [], links: [], images: [], text: [] };
  const textOf = (n: RichNode): string => (n.type === "text" ? n.text ?? "" : (n.content ?? []).map(textOf).join(n.type === "paragraph" ? "" : " "));
  const visit = (n: RichNode) => {
    if (n.type === "heading") w.heads.push({ level: Number(n.attrs?.level ?? 2), text: textOf(n) });
    if (n.type === "paragraph") {
      const s = textOf(n).trim();
      if (s) w.paras.push(s);
    }
    if (n.type === "image") w.images.push({ alt: String(n.attrs?.alt ?? "") });
    if (n.type === "text") {
      w.text.push(n.text ?? "");
      for (const m of n.marks ?? []) if (m.type === "link" && m.attrs?.href) w.links.push(String(m.attrs.href));
    }
    if (n.type === "cta" && n.attrs?.href) w.links.push(String(n.attrs.href));
    if (n.type === "file" && n.attrs?.href) w.links.push(String(n.attrs.href));
    if (n.type === "gallery" && Array.isArray(n.attrs?.images)) for (const g of n.attrs.images as { alt?: string }[]) w.images.push({ alt: String(g?.alt ?? "") });
    // Text held in block attributes (pull quote, figure) counts towards length and keyphrase use.
    for (const k of ["text", "cite", "value", "label", "note"] as const) if (["pullquote", "stat"].includes(n.type) && n.attrs?.[k]) w.text.push(String(n.attrs[k]));
    (n.content ?? []).forEach(visit);
  };
  (doc?.content ?? []).forEach(visit);
  return w;
}

const sentencesOf = (paras: string[]) => paras.flatMap((p) => p.split(/(?<=[.!?؟؛])\s+|\n+/).map((s) => s.trim()).filter((s) => words(s).length > 0));

export function analyze(i: AnalyzeInput): Analysis {
  const w = walk(i.doc);
  const body = w.text.join(" ");
  const wc = words(body).length;
  const sentences = sentencesOf(w.paras);
  const sw = sentences.map((s) => words(s).length);
  const avgSentence = sw.length ? sw.reduce((a, b) => a + b, 0) / sw.length : 0;
  const longPct = sw.length ? (sw.filter((n) => n > 25).length / sw.length) * 100 : 0;
  const focus = i.focus.trim();
  const occ = focus ? countPhrase(body, focus) : 0;
  const fwords = Math.max(1, words(focus).length);
  const density = wc ? ((occ * fwords) / wc) * 100 : 0;
  const host = (i.siteHost ?? "").replace(/^www\./, "");
  const internal = w.links.filter((h) => h.startsWith("/") || h.startsWith("#") || (host && h.includes(host))).length;
  const external = w.links.filter((h) => /^https?:\/\//.test(h) && !(host && h.includes(host))).length;
  const noAlt = w.images.filter((im) => !im.alt.trim()).length;
  const seoTitle = (i.seoTitle || i.title).trim();
  const desc = (i.description || i.excerpt).trim();
  const h2 = w.heads.filter((h) => h.level === 2).length;
  const h3 = w.heads.filter((h) => h.level === 3).length;
  const firstPara = w.paras[0] ?? "";
  const checks: Check[] = [];
  const add = (c: Check) => checks.push(c);

  /* ── SEO ── */
  if (!focus) {
    add({ id: "focus", group: "seo", level: "bad", label: ["لم تُحدَّد الكلمة المفتاحية الرئيسية", "No focus keyphrase set"], tip: ["اختر العبارة التي يبحث بها جمهورك، مثل «ضريبة المرتبات».", "Pick the phrase your readers search for, e.g. “payroll tax”."] });
  } else {
    add(has(seoTitle, focus)
      ? { id: "kw-title", group: "seo", level: words(seoTitle).slice(0, 5).join(" ").includes(norm(focus).split(" ")[0]!) ? "good" : "ok", label: ["الكلمة المفتاحية في عنوان SEO", "Keyphrase in the SEO title"], tip: ["الأفضل أن تأتي في بداية العنوان.", "Best placed near the start of the title."] }
      : { id: "kw-title", group: "seo", level: "bad", label: ["الكلمة المفتاحية غير موجودة في عنوان SEO", "Keyphrase missing from the SEO title"], tip: ["أضفها إلى العنوان، ويفضّل في أوله.", "Add it to the title, ideally at the start."] });
    add(has(desc, focus)
      ? { id: "kw-desc", group: "seo", level: "good", label: ["الكلمة المفتاحية في الوصف التعريفي", "Keyphrase in the meta description"] }
      : { id: "kw-desc", group: "seo", level: "bad", label: ["الكلمة المفتاحية غير موجودة في الوصف التعريفي", "Keyphrase missing from the meta description"], tip: ["اذكرها مرة واحدة بشكل طبيعي في الوصف.", "Mention it once, naturally, in the description."] });
    const slugText = decodeURIComponent(i.slug).replace(/[-_]/g, " ");
    add(has(slugText, focus) || words(focus).every((x) => norm(slugText).includes(x))
      ? { id: "kw-slug", group: "seo", level: "good", label: ["الكلمة المفتاحية في رابط المقال", "Keyphrase in the URL slug"] }
      : { id: "kw-slug", group: "seo", level: "ok", label: ["الكلمة المفتاحية ليست في رابط المقال", "Keyphrase not in the URL slug"], tip: ["رابط قصير يحتوي الكلمة المفتاحية يساعد في الترتيب.", "A short slug containing the keyphrase helps ranking."] });
    add(has(firstPara, focus)
      ? { id: "kw-intro", group: "seo", level: "good", label: ["الكلمة المفتاحية في الفقرة الأولى", "Keyphrase in the first paragraph"] }
      : { id: "kw-intro", group: "seo", level: "bad", label: ["الكلمة المفتاحية غير موجودة في المقدمة", "Keyphrase missing from the introduction"], tip: ["اذكرها في الفقرة الأولى ليفهم القارئ ومحرك البحث الموضوع فورًا.", "Use it in the first paragraph so readers and search engines get the topic straight away."] });
    add(w.heads.some((h) => has(h.text, focus) || words(focus).filter((x) => norm(h.text).includes(x)).length >= Math.ceil(fwords / 2))
      ? { id: "kw-head", group: "seo", level: "good", label: ["الكلمة المفتاحية في عنوان فرعي", "Keyphrase in a subheading"] }
      : { id: "kw-head", group: "seo", level: "ok", label: ["لا يوجد عنوان فرعي يتضمن الكلمة المفتاحية", "No subheading uses the keyphrase"], tip: ["أدرجها (أو مرادفًا قريبًا) في عنوان H2 أو H3.", "Use it (or a close variant) in an H2 or H3."] });
    add(density >= 0.5 && density <= 2.5
      ? { id: "density", group: "seo", level: "good", label: [`كثافة الكلمة المفتاحية مناسبة (${density.toFixed(1)}٪ · ${occ} مرة)`, `Keyphrase density is good (${density.toFixed(1)}% · ${occ}×)`] }
      : density > 2.5
        ? { id: "density", group: "seo", level: "bad", label: [`تكرار مبالغ فيه للكلمة المفتاحية (${density.toFixed(1)}٪)`, `Keyphrase over-used (${density.toFixed(1)}%)`], tip: ["خفّف التكرار واستخدم مرادفات؛ الحشو يضر الترتيب.", "Use it less and vary with synonyms; stuffing hurts rankings."] }
        : { id: "density", group: "seo", level: occ ? "ok" : "bad", label: [`الكلمة المفتاحية قليلة في النص (${occ} مرة)`, `Keyphrase rarely used (${occ}×)`], tip: ["استهدف 0.5–2.5٪ من النص.", "Aim for 0.5–2.5% of the text."] });
    if (i.otherFocus?.some((k) => norm(k) === norm(focus)))
      add({ id: "kw-unique", group: "seo", level: "bad", label: ["الكلمة المفتاحية مستخدمة في مقال آخر", "Keyphrase already used in another post"], tip: ["مقالان على نفس الكلمة يتنافسان في نتائج البحث.", "Two posts on the same keyphrase compete with each other."] });
    const extra = (i.keywords ?? []).filter((k) => k && norm(k) !== norm(focus)).slice(0, 8);
    if (extra.length) {
      const missing = extra.filter((k) => !has(body, k) && !has(i.title, k));
      add(missing.length === 0
        ? { id: "kw-extra", group: "seo", level: "good", label: [`الكلمات الثانوية مستخدمة (${extra.length})`, `Secondary keyphrases used (${extra.length})`] }
        : { id: "kw-extra", group: "seo", level: "ok", label: [`كلمات ثانوية غير مستخدمة: ${missing.join("، ")}`, `Secondary keyphrases not used yet: ${missing.join(", ")}`], tip: ["استخدم كل كلمة ثانوية مرة على الأقل في النص أو العناوين.", "Use each one at least once in the text or a heading."] });
    }
    const start = norm(i.seoTitle || i.title).startsWith(norm(focus));
    add(start
      ? { id: "kw-start", group: "seo", level: "good", label: ["العنوان يبدأ بالكلمة المفتاحية", "The title starts with the keyphrase"] }
      : { id: "kw-start", group: "seo", level: "ok", label: ["العنوان لا يبدأ بالكلمة المفتاحية", "The title doesn't start with the keyphrase"], tip: ["الكلمات في بداية العنوان لها وزن أكبر وتظهر أولًا في النتائج.", "Words at the start of the title weigh more and are seen first in results."] });
    if (w.images.length && !w.images.some((im) => has(im.alt, focus)) && !has(i.coverAlt, focus))
      add({ id: "kw-alt", group: "seo", level: "ok", label: ["لا يوجد نص بديل لصورة يتضمن الكلمة المفتاحية", "No image alt text uses the keyphrase"], tip: ["صِف صورة واحدة على الأقل بعبارة تتضمنها.", "Describe at least one image with it."] });
  }

  const tl = seoTitle.length;
  add(tl >= 30 && tl <= 60
    ? { id: "title-len", group: "seo", level: "good", label: [`طول عنوان SEO مثالي (${tl} حرفًا)`, `SEO title length is ideal (${tl} chars)`] }
    : { id: "title-len", group: "seo", level: tl >= 20 && tl <= 70 ? "ok" : "bad", label: [`طول عنوان SEO ${tl} حرفًا`, `SEO title is ${tl} characters`], tip: ["المثالي 30–60 حرفًا حتى لا يُقصّ في نتائج جوجل.", "Aim for 30–60 characters so Google doesn't truncate it."] });
  const dl = desc.length;
  add(dl >= 120 && dl <= 160
    ? { id: "desc-len", group: "seo", level: "good", label: [`طول الوصف التعريفي مثالي (${dl} حرفًا)`, `Meta description length is ideal (${dl} chars)`] }
    : { id: "desc-len", group: "seo", level: dl >= 70 && dl <= 170 ? "ok" : "bad", label: [dl ? `الوصف التعريفي ${dl} حرفًا` : "لا يوجد وصف تعريفي", dl ? `Meta description is ${dl} characters` : "No meta description"], tip: ["المثالي 120–160 حرفًا يلخّص المقال ويدعو للنقر.", "Aim for 120–160 characters that sum up the post and invite the click."] });
  add(wc >= 600
    ? { id: "length", group: "seo", level: "good", label: [`طول المقال ممتاز (${wc} كلمة)`, `Great length (${wc} words)`] }
    : { id: "length", group: "seo", level: wc >= 300 ? "ok" : "bad", label: [`المقال قصير (${wc} كلمة)`, `The post is short (${wc} words)`], tip: ["المقالات الشاملة (600 كلمة فأكثر) تحقق ترتيبًا أفضل.", "In-depth posts (600+ words) tend to rank better."] });
  add(internal > 0
    ? { id: "internal", group: "seo", level: "good", label: [`روابط داخلية: ${internal}`, `Internal links: ${internal}`] }
    : { id: "internal", group: "seo", level: "bad", label: ["لا توجد روابط داخلية", "No internal links"], tip: ["اربط بصفحة خدمة أو مقال آخر على الموقع.", "Link to a service page or another post on the site."] });
  add(external > 0
    ? { id: "external", group: "seo", level: "good", label: [`روابط خارجية لمصادر: ${external}`, `Outbound links to sources: ${external}`] }
    : { id: "external", group: "seo", level: "ok", label: ["لا توجد روابط لمصادر خارجية", "No outbound links"], tip: ["الإشارة إلى مصدر رسمي (قانون، منشور، جهة حكومية) تعزز الثقة.", "Citing an official source (a law, a circular, an authority) builds trust."] });
  add(w.images.length + (i.cover ? 1 : 0) > 0
    ? noAlt === 0
      ? { id: "images", group: "seo", level: "good", label: ["كل الصور لها نص بديل", "Every image has alt text"] }
      : { id: "images", group: "seo", level: "bad", label: [`${noAlt} صورة دون نص بديل`, `${noAlt} image(s) without alt text`], tip: ["اضغط على الصورة واختر «أضف ALT».", "Click the image and choose “Add ALT”."] }
    : { id: "images", group: "seo", level: "ok", label: ["لا توجد صور", "No images"], tip: ["صورة واحدة على الأقل تحسّن التفاعل والظهور في بحث الصور.", "At least one image improves engagement and image-search visibility."] });
  add(i.cover
    ? { id: "cover", group: "seo", level: i.coverAlt.trim() ? "good" : "ok", label: [i.coverAlt.trim() ? "صورة الغلاف ونصها البديل جاهزان" : "صورة الغلاف بلا نص بديل", i.coverAlt.trim() ? "Cover image and its alt text are set" : "Cover image has no alt text"] }
    : { id: "cover", group: "seo", level: "ok", label: ["لا توجد صورة غلاف", "No cover image"], tip: ["تظهر عند مشاركة المقال على واتساب ولينكدإن وفيسبوك.", "It shows when the post is shared on WhatsApp, LinkedIn and Facebook."] });
  add(i.excerpt.trim()
    ? { id: "excerpt", group: "seo", level: "good", label: ["الملخص مكتوب", "Excerpt is written"] }
    : { id: "excerpt", group: "seo", level: "ok", label: ["لا يوجد ملخص", "No excerpt"], tip: ["يظهر في صفحة المقالات وكوصف احتياطي.", "Shown on the insights listing and used as a fallback description."] });
  const sl = decodeURIComponent(i.slug).length;
  if (i.slug) add(sl <= 75 ? { id: "slug-len", group: "seo", level: "good", label: ["الرابط قصير ومقروء", "The slug is short and readable"] } : { id: "slug-len", group: "seo", level: "ok", label: [`الرابط طويل (${sl} حرفًا)`, `The slug is long (${sl} chars)`], tip: ["اختصره إلى 3–6 كلمات.", "Trim it to 3–6 words."] });

  /* ── Readability ── */
  add(h2 > 0
    ? { id: "h2", group: "read", level: "good", label: [`المقال مقسّم بعناوين (H2: ${h2}، H3: ${h3})`, `Structured with headings (H2: ${h2}, H3: ${h3})`] }
    : { id: "h2", group: "read", level: wc > 300 ? "bad" : "ok", label: ["لا توجد عناوين فرعية H2", "No H2 subheadings"], tip: ["قسّم المقال بعناوين كل 250–300 كلمة.", "Break the post up with a heading every 250–300 words."] });
  let skipped = false;
  let prev = 1;
  for (const h of w.heads) {
    if (h.level > prev + 1) skipped = true;
    prev = h.level;
  }
  if (w.heads.length) add(skipped ? { id: "hier", group: "read", level: "ok", label: ["تسلسل العناوين غير منتظم", "Heading levels skip a step"], tip: ["لا تقفز من H2 إلى H4 مباشرة.", "Don't jump from H2 straight to H4."] } : { id: "hier", group: "read", level: "good", label: ["تسلسل العناوين سليم", "Heading hierarchy is clean"] });
  // longest run of words without a heading
  let run = 0;
  let maxRun = 0;
  for (const n of i.doc?.content ?? []) {
    if (n.type === "heading") run = 0;
    else run += words((n.content ?? []).map(function t(x: RichNode): string { return x.type === "text" ? x.text ?? "" : (x.content ?? []).map(t).join(" "); }).join(" ")).length;
    maxRun = Math.max(maxRun, run);
  }
  if (wc > 300) add(maxRun <= 350 ? { id: "dist", group: "read", level: "good", label: ["توزيع العناوين جيد", "Subheadings are well distributed"] } : { id: "dist", group: "read", level: "ok", label: [`قسم طويل بلا عنوان (${maxRun} كلمة)`, `A long stretch without a heading (${maxRun} words)`], tip: ["أضف عنوانًا فرعيًا يقسم هذا الجزء.", "Add a subheading to break it up."] });
  if (sentences.length)
    add(avgSentence <= 20
      ? { id: "sent", group: "read", level: "good", label: [`متوسط طول الجملة ${avgSentence.toFixed(0)} كلمة`, `Average sentence: ${avgSentence.toFixed(0)} words`] }
      : { id: "sent", group: "read", level: avgSentence <= 26 ? "ok" : "bad", label: [`الجمل طويلة (متوسط ${avgSentence.toFixed(0)} كلمة)`, `Sentences are long (avg ${avgSentence.toFixed(0)} words)`], tip: ["قسّم الجمل الطويلة؛ الهدف أقل من 20 كلمة.", "Split long sentences; aim for under 20 words."] });
  if (sentences.length > 3)
    add(longPct <= 25
      ? { id: "long", group: "read", level: "good", label: ["نسبة الجمل الطويلة مقبولة", "Few long sentences"] }
      : { id: "long", group: "read", level: "ok", label: [`${longPct.toFixed(0)}٪ من الجمل تتجاوز 25 كلمة`, `${longPct.toFixed(0)}% of sentences exceed 25 words`], tip: ["حافظ عليها دون 25٪.", "Keep it below 25%."] });
  const longPara = w.paras.filter((p) => words(p).length > 150).length;
  if (w.paras.length) add(longPara ? { id: "para", group: "read", level: "ok", label: [`${longPara} فقرة طويلة جدًا`, `${longPara} very long paragraph(s)`], tip: ["قسّم الفقرات إلى 3–5 جمل.", "Keep paragraphs to 3–5 sentences."] } : { id: "para", group: "read", level: "good", label: ["أطوال الفقرات مريحة للقراءة", "Paragraph lengths are comfortable"] });
  const lists = JSON.stringify(i.doc ?? {}).match(/"type":"(bulletList|orderedList|taskList|table)"/g)?.length ?? 0;
  if (wc > 400) add(lists ? { id: "scan", group: "read", level: "good", label: ["يحتوي قوائم أو جداول تسهّل التصفح", "Uses lists or tables for skimming"] } : { id: "scan", group: "read", level: "ok", label: ["لا قوائم ولا جداول", "No lists or tables"], tip: ["القوائم تجعل الخطوات والمتطلبات أسهل قراءة.", "Lists make steps and requirements easier to scan."] });

  const score = (g: "seo" | "read") => {
    const list = checks.filter((c) => c.group === g);
    if (!list.length) return 0;
    return Math.round((list.reduce((a, c) => a + (c.level === "good" ? 1 : c.level === "ok" ? 0.5 : 0), 0) / list.length) * 100);
  };
  return {
    seo: score("seo"),
    read: score("read"),
    checks,
    stats: { words: wc, sentences: sentences.length, paragraphs: w.paras.length, avgSentence, longSentencePct: longPct, h2, h3, internal, external, images: w.images.length, imagesNoAlt: noAlt, density, occurrences: occ },
  };
}

/** Rough pixel width of a SERP title (Google truncates around 580px at 20px Arial). */
export function serpWidth(s: string) {
  let px = 0;
  for (const ch of s) px += /[؀-ۿ]/.test(ch) ? 8.2 : /[A-Z]/.test(ch) ? 12.5 : /[a-z0-9]/.test(ch) ? 9.6 : /\s/.test(ch) ? 5 : 8;
  return Math.round(px);
}

/** URL-safe slug from a title; keeps Arabic letters (valid in modern URLs and readable in SERPs). */
export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
    .replace(/-$/, "");
}
