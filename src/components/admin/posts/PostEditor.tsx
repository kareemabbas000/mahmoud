"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { ProEditor } from "../editor/ProEditor";
import { ImageInput } from "../Fields";
import { canEdit, useAdmin, useResult } from "../AdminContext";
import { deletePost, duplicatePost, listPostVersions, savePost, type PostInput, type PostVersion } from "@/app/actions/posts";
import { analyze, serpWidth, slugify, type Check } from "@/lib/seo-analyzer";
import type { RichDoc } from "@/lib/types";

type L<T = string> = Record<string, T>;
/** Front-end reading layouts (rendered by app/(site)/[locale]/insights/[slug]/page.tsx). */
const LAYOUTS: { key: "classic" | "feature" | "minimal"; label: [string, string]; hint: [string, string] }[] = [
  { key: "classic", label: ["كلاسيكي", "Classic"], hint: ["فهرس جانبي وغلاف تحت العنوان", "Side contents, cover under the title"] },
  { key: "feature", label: ["مميّز", "Feature"], hint: ["غلاف كامل العرض خلف العنوان", "Full-width cover behind the title"] },
  { key: "minimal", label: ["بسيط", "Minimal"], hint: ["عمود قراءة واحد هادئ", "One calm reading column"] },
];

export type EditablePost = PostInput & { id: string; updated_at: string; translation_status: L };
type Tax = { id: string; slug: string; name: L };

const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

function Ring({ value, label, t }: { value: number; label: string; t: (a: string, e: string) => string }) {
  const c = value >= 75 ? "#0f7a4a" : value >= 50 ? "#e08a00" : "#b42318";
  return (
    <div className="flex items-center gap-3">
      <svg width="54" height="54" viewBox="0 0 36 36" aria-hidden="true">
        <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--rule)" strokeWidth="3.5" />
        <circle cx="18" cy="18" r="15.5" fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${(value / 100) * 97.4} 97.4`} transform="rotate(-90 18 18)" style={{ transition: "stroke-dasharray .5s" }} />
        <text x="18" y="21.5" textAnchor="middle" fontSize="10" fontWeight="700" fill="currentColor">{value}</text>
      </svg>
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm font-semibold" style={{ color: c }}>{value >= 75 ? t("ممتاز", "Great") : value >= 50 ? t("جيد", "OK") : t("يحتاج تحسين", "Needs work")}</p>
      </div>
    </div>
  );
}

function Meter({ len, min, max, hard }: { len: number; min: number; max: number; hard: number }) {
  const pct = Math.min(100, (len / hard) * 100);
  const c = len === 0 ? "var(--rule-strong)" : len >= min && len <= max ? "#0f7a4a" : len > hard ? "#b42318" : "#e08a00";
  return (
    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper-2">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: c }} />
    </div>
  );
}

function CheckRow({ c, t }: { c: Check; t: (a: string, e: string) => string }) {
  const dot = { good: "#0f7a4a", ok: "#e08a00", bad: "#b42318" }[c.level];
  return (
    <li className="flex gap-2.5 py-1.5 text-[0.8rem] leading-snug">
      <span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ background: dot }} />
      <span>
        <span className="text-ink">{t(...c.label)}</span>
        {c.tip && c.level !== "good" && <span className="block text-muted">{t(...c.tip)}</span>}
      </span>
    </li>
  );
}

export function PostEditor({ initial, cats, tags, authors, otherFocus, siteHost, siteUrl }: { initial: EditablePost; cats: Tax[]; tags: Tax[]; authors: Tax[]; otherFocus: Record<string, string[]>; siteHost: string; siteUrl: string }) {
  const { t, locale: uiLocale, langs, role } = useAdmin();
  const show = useResult();
  const router = useRouter();
  const editable = canEdit(role, "editor");
  const enabled = langs.filter((l) => l.enabled);
  const def = langs.find((l) => l.is_default)?.code ?? "ar";
  const [lang, setLang] = useState(def);
  const L = langs.find((l) => l.code === lang) ?? langs[0]!;
  const [p, setP] = useState<EditablePost>(() => ({ ...initial, seo: initial.seo ?? {}, faqs: initial.faqs ?? {}, body: initial.body ?? {}, tag_ids: initial.tag_ids ?? [] }));
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [savedAt, setSavedAt] = useState<string>(initial.updated_at);
  const [tab, setTab] = useState<"publish" | "seo" | "settings" | "faq" | "history">("seo");
  const [autoAt, setAutoAt] = useState<string | null>(null);
  const [versions, setVersions] = useState<PostVersion[] | null>(null);
  const [mode, setMode] = useState<"draft" | "now" | "schedule">(initial.status === "draft" ? "draft" : initial.publish_at && new Date(initial.publish_at) > new Date() ? "schedule" : "now");
  const [when, setWhen] = useState(toLocalInput(initial.publish_at));
  const [slugTouched, setSlugTouched] = useState<L<boolean>>(() => Object.fromEntries(Object.entries(initial.slug ?? {}).map(([k, v]) => [k, Boolean(v)])));
  const [restore, setRestore] = useState<{ at: string; data: EditablePost } | null>(null);
  const [serpMobile, setSerpMobile] = useState(false);
  const [pending, start] = useTransition();
  const storeKey = `sco-post-${initial.id}`;
  const dirty = JSON.stringify(p) !== saved;
  const live = initial.status !== "draft";

  /* local backup: offer to restore unsaved work from this browser */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storeKey);
      if (!raw) return;
      const b = JSON.parse(raw) as { at: string; data: EditablePost };
      if (new Date(b.at) > new Date(initial.updated_at) && JSON.stringify(b.data) !== JSON.stringify(initial)) setRestore(b);
      else localStorage.removeItem(storeKey);
    } catch {}
  }, [storeKey, initial]);
  useEffect(() => {
    if (!dirty) return;
    const h = setTimeout(() => {
      try {
        localStorage.setItem(storeKey, JSON.stringify({ at: new Date().toISOString(), data: p }));
      } catch {}
    }, 800);
    return () => clearTimeout(h);
  }, [p, dirty, storeKey]);
  useEffect(() => {
    if (!dirty) return;
    const w = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", w);
    return () => window.removeEventListener("beforeunload", w);
  }, [dirty]);

  /* Drafts save to the server by themselves after 12 s without typing (published posts never autosave:
     changes to a live post only go out when you press Update). */
  useEffect(() => {
    if (!dirty || !editable || mode !== "draft" || p.status !== "draft") return;
    const h = setTimeout(async () => {
      const snapshot = JSON.stringify(p);
      const r = await savePost(p.id, { ...p, status: "draft" }, { autosave: true });
      if (r.ok) {
        setSaved(snapshot);
        const now = new Date().toISOString();
        setSavedAt(now);
        setAutoAt(now);
        try { localStorage.removeItem(storeKey); } catch {}
      }
    }, 12000);
    return () => clearTimeout(h);
  }, [p, dirty, editable, mode, storeKey]);

  /* Revision history loads when its tab opens. */
  useEffect(() => {
    if (tab !== "history" || versions) return;
    void listPostVersions(p.id).then((r) => setVersions(r.ok ? (r.data as { versions: PostVersion[] }).versions : []));
  }, [tab, versions, p.id]);

  const set = useCallback(<K extends keyof EditablePost>(k: K, v: EditablePost[K]) => setP((x) => ({ ...x, [k]: v })), [setP]);
  const setL = useCallback(<K extends "title" | "excerpt" | "slug" | "cover_alt">(k: K, v: string) => setP((x) => ({ ...x, [k]: { ...(x[k] as L), [lang]: v } })), [lang, setP]);
  const seo = useMemo(() => p.seo?.[lang] ?? {}, [p.seo, lang]);
  const setSeo = (patch: Partial<typeof seo>) => setP((x) => ({ ...x, seo: { ...x.seo, [lang]: { ...(x.seo?.[lang] ?? {}), ...patch } } }));

  const onTitle = (v: string) => {
    setP((x) => ({ ...x, title: { ...x.title, [lang]: v }, ...(!slugTouched[lang] && !live ? { slug: { ...x.slug, [lang]: slugify(v) } } : {}) }));
  };

  const a = useMemo(
    () =>
      analyze({
        locale: lang,
        title: p.title?.[lang] ?? "",
        seoTitle: seo.title ?? "",
        description: seo.description ?? "",
        slug: p.slug?.[lang] ?? "",
        focus: seo.focus_keyword ?? "",
        keywords: (seo.keywords ?? "").split(/[,،]/).map((x) => x.trim()).filter(Boolean),
        excerpt: p.excerpt?.[lang] ?? "",
        doc: p.body?.[lang] as RichDoc | undefined,
        cover: p.cover,
        coverAlt: p.cover_alt?.[lang] ?? "",
        siteHost,
        otherFocus: otherFocus[lang],
      }),
    [p, lang, seo, siteHost, otherFocus],
  );

  const doSave = useCallback(
    (nextMode = mode) => {
      if (!editable) return;
      const status = nextMode === "draft" ? "draft" : nextMode === "schedule" ? "scheduled" : "published";
      const publish_at = nextMode === "schedule" ? (when ? new Date(when).toISOString() : null) : nextMode === "now" ? p.publish_at && p.status !== "draft" ? p.publish_at : null : p.publish_at;
      start(async () => {
        const r = await savePost(p.id, { ...p, status, publish_at });
        const ok = show(r, nextMode === "draft" ? t("تم حفظ المسودة", "Draft saved") : nextMode === "schedule" ? t("تمت الجدولة", "Scheduled") : t("تم النشر — المقال على الموقع الآن", "Published — the post is live now"));
        if (ok && r.ok) {
          const d = r.data as { status: EditablePost["status"]; publish_at: string | null };
          const next = { ...p, status: d.status, publish_at: d.publish_at };
          setP(next);
          setSaved(JSON.stringify(next));
          setSavedAt(new Date().toISOString());
          setMode(nextMode);
          try {
            localStorage.removeItem(storeKey);
          } catch {}
          router.refresh();
        }
      });
    },
    [editable, mode, when, p, show, t, storeKey, router, setP],
  );

  /* Ctrl/Cmd+S saves */
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        doSave();
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [doSave]);

  const seoTitle = seo.title || p.title?.[lang] || "";
  const desc = seo.description || p.excerpt?.[lang] || "";
  const url = `${siteUrl.replace(/\/$/, "")}/${lang}/insights/${p.slug?.[lang] || "…"}`;
  const issues = a.checks.filter((c) => c.level !== "good").sort((x, y) => (x.level === "bad" ? -1 : 1) - (y.level === "bad" ? -1 : 1));
  const goods = a.checks.filter((c) => c.level === "good");
  const time = (iso: string) => new Intl.DateTimeFormat(uiLocale === "ar" ? "ar-EG-u-nu-latn" : "en-GB", { timeStyle: "short", dateStyle: "short" }).format(new Date(iso));
  const primaryLabel = mode === "draft" ? t("حفظ المسودة", "Save draft") : mode === "schedule" ? t("جدولة", "Schedule") : live ? t("تحديث", "Update") : t("نشر", "Publish");

  return (
    <div className="pe">
      {/* top bar */}
      <div className="pe-bar">
        <Link href="/admin/posts" className="text-sm text-muted hover:text-ink">← {t("المقالات", "Posts")}</Link>
        <div className="pe-langs" role="tablist" aria-label={t("لغة المحتوى", "Content language")}>
          {enabled.map((l) => {
            const missing = !p.title?.[l.code]?.trim() || !(p.body?.[l.code] as RichDoc | undefined)?.content?.length;
            return (
              <button key={l.code} type="button" role="tab" aria-selected={lang === l.code} onClick={() => setLang(l.code)} className={lang === l.code ? "is-on" : ""}>
                {l.native_name}
                {missing && <span className="pe-dot" title={t("لم يكتمل", "Incomplete")} />}
              </button>
            );
          })}
        </div>
        <span className="pe-state">
          {pending ? t("جارٍ الحفظ…", "Saving…") : dirty ? <span className="text-orange-text">● {t("تغييرات غير محفوظة", "Unsaved changes")}</span> : <>✓ {t("محفوظ", "Saved")} · {time(savedAt)}</>}
        </span>
        <div className="ms-auto flex flex-wrap items-center gap-2">
          <a href={`/admin/preview/post/${p.id}?lang=${lang}`} target="_blank" className="btn btn-ghost !min-h-10 !px-4 text-sm" onClick={(e) => { if (dirty) { e.preventDefault(); doSave(mode); setTimeout(() => window.open(`/admin/preview/post/${p.id}?lang=${lang}`, "_blank"), 900); } }}>
            {t("معاينة", "Preview")} ↗
          </a>
          {editable && (
            <button type="button" disabled={pending} onClick={() => doSave()} className="btn btn-primary !min-h-10 !px-5 text-sm">
              {primaryLabel}
            </button>
          )}
        </div>
      </div>

      {restore && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-orange/40 bg-[#fff4ec] px-4 py-3 text-sm text-ink">
          <span>{t("وُجدت نسخة غير محفوظة من هذا المقال على هذا الجهاز", "There's an unsaved copy of this post on this device")} ({time(restore.at)}).</span>
          <button type="button" className="font-semibold text-blue" onClick={() => { setP(restore.data); setRestore(null); }}>{t("استعادتها", "Restore it")}</button>
          <button type="button" className="text-muted" onClick={() => { localStorage.removeItem(storeKey); setRestore(null); }}>{t("تجاهل", "Discard")}</button>
        </div>
      )}

      <div className="pe-grid">
        {/* writing column */}
        <div className="min-w-0" lang={lang} dir={L.dir}>
          <textarea
            className="pe-title"
            rows={1}
            value={p.title?.[lang] ?? ""}
            onChange={(e) => onTitle(e.target.value)}
            placeholder={t("عنوان المقال…", "Post title…")}
            onInput={(e) => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; }}
            readOnly={!editable}
          />
          <div className="pe-slug" dir="ltr">
            <span className="text-faint">/{lang}/insights/</span>
            <input
              value={p.slug?.[lang] ?? ""}
              onChange={(e) => { setSlugTouched((x) => ({ ...x, [lang]: true })); setL("slug", e.target.value.replace(/\s+/g, "-")); }}
              onBlur={(e) => setL("slug", slugify(e.target.value))}
              aria-label={t("رابط المقال", "URL slug")}
              readOnly={!editable}
            />
            <button type="button" className="text-xs text-blue hover:underline" onClick={() => { setL("slug", slugify(p.title?.[lang] ?? "")); setSlugTouched((x) => ({ ...x, [lang]: true })); }}>
              {t("توليد من العنوان", "From title")}
            </button>
          </div>
          {live && <p className="-mt-2 mb-4 text-xs text-muted">{t("تغيير رابط مقال منشور يكسر الروابط المشارَكة سابقًا؛ أضف تحويلًا من «التحويلات» إن غيّرته.", "Changing a live post's slug breaks links already shared; add a redirect under “Redirects” if you change it.")}</p>}
          <label className="mb-5 block">
            <span className="mb-1 flex items-center justify-between text-xs text-muted">
              <span>{t("الملخص (يظهر في قائمة المقالات وكوصف احتياطي)", "Excerpt (shown on the listing and as a fallback description)")}</span>
              <span className="tnum">{(p.excerpt?.[lang] ?? "").length}/220</span>
            </span>
            <textarea className="ed-input min-h-20" value={p.excerpt?.[lang] ?? ""} onChange={(e) => setL("excerpt", e.target.value)} maxLength={300} readOnly={!editable} />
          </label>
          <ProEditor key={lang} value={p.body?.[lang] as RichDoc | undefined} onChange={(doc) => setP((x) => ({ ...x, body: { ...x.body, [lang]: doc } }))} dir={L.dir} lang={lang} />
        </div>

        {/* side panel */}
        <aside className="pe-side">
          <div className="pe-tabs" role="tablist">
            {(["seo", "publish", "settings", "faq", "history"] as const).map((k) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={tab === k ? "is-on" : ""}>
                {{ seo: "SEO", publish: t("النشر", "Publish"), settings: t("الإعدادات", "Settings"), faq: t("الأسئلة", "FAQ"), history: t("السجل", "History") }[k]}
                {k === "seo" && <span className="pe-score" style={{ background: a.seo >= 75 ? "#0f7a4a" : a.seo >= 50 ? "#e08a00" : "#b42318" }}>{a.seo}</span>}
              </button>
            ))}
          </div>

          {tab === "seo" && (
            <div className="grid gap-5" lang={lang} dir={L.dir}>
              <div className="grid grid-cols-2 gap-3">
                <Ring t={t} value={a.seo} label={t("تحسين محركات البحث", "SEO")} />
                <Ring t={t} value={a.read} label={t("سهولة القراءة", "Readability")} />
              </div>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold text-ink">🎯 {t("الكلمة المفتاحية الرئيسية", "Focus keyphrase")}</span>
                <input className="ed-input" value={seo.focus_keyword ?? ""} onChange={(e) => setSeo({ focus_keyword: e.target.value })} placeholder={t("مثال: ضريبة المرتبات", "e.g. payroll tax")} />
                {seo.focus_keyword && <span className="text-xs text-muted">{t("تكرارها في النص", "Used in the text")}: <b className="tnum">{a.stats.occurrences}</b> · {t("الكثافة", "density")} <b className="tnum">{a.stats.density.toFixed(1)}%</b></span>}
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold text-ink">{t("كلمات مفتاحية ثانوية (اختياري)", "Secondary keyphrases (optional)")}</span>
                <input className="ed-input" value={seo.keywords ?? ""} onChange={(e) => setSeo({ keywords: e.target.value })} placeholder={t("مرادفات أو صيغ أخرى، مفصولة بفواصل", "Synonyms or related phrases, comma-separated")} />
              </label>
              <label className="grid gap-1">
                <span className="flex justify-between text-xs"><b className="text-ink">{t("عنوان SEO", "SEO title")}</b><span className="tnum text-muted">{seoTitle.length} / 60 · {serpWidth(seoTitle)}px</span></span>
                <input className="ed-input" value={seo.title ?? ""} onChange={(e) => setSeo({ title: e.target.value })} placeholder={p.title?.[lang] || t("يُستخدم عنوان المقال إن تُرك فارغًا", "Falls back to the post title")} />
                <Meter len={seoTitle.length} min={30} max={60} hard={70} />
              </label>
              <label className="grid gap-1">
                <span className="flex justify-between text-xs"><b className="text-ink">{t("الوصف التعريفي", "Meta description")}</b><span className="tnum text-muted">{desc.length} / 160</span></span>
                <textarea className="ed-input min-h-24" value={seo.description ?? ""} onChange={(e) => setSeo({ description: e.target.value })} placeholder={p.excerpt?.[lang] || t("120–160 حرفًا تلخّص المقال وتدعو للنقر", "120–160 characters that sum up the post and invite the click")} />
                <Meter len={desc.length} min={120} max={160} hard={175} />
              </label>

              {/* SERP preview */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink">{t("معاينة نتيجة جوجل", "Google preview")}</span>
                  <div className="flex gap-1 rounded-full bg-paper-2 p-0.5 text-[0.7rem]">
                    <button type="button" onClick={() => setSerpMobile(false)} className={`rounded-full px-2 py-0.5 ${!serpMobile ? "bg-surface shadow-soft" : ""}`}>{t("كمبيوتر", "Desktop")}</button>
                    <button type="button" onClick={() => setSerpMobile(true)} className={`rounded-full px-2 py-0.5 ${serpMobile ? "bg-surface shadow-soft" : ""}`}>{t("موبايل", "Mobile")}</button>
                  </div>
                </div>
                <div className={`serp ${serpMobile ? "is-mobile" : ""}`} dir={L.dir}>
                  <div className="serp-site"><span className="serp-fav">S</span><span><b>SCO</b><small dir="ltr">{url.replace(/^https?:\/\//, "").replace(/\//g, " › ")}</small></span></div>
                  <p className="serp-title">{seoTitle ? (serpWidth(seoTitle) > 580 ? `${seoTitle.slice(0, Math.floor(seoTitle.length * (580 / serpWidth(seoTitle))) - 1)}…` : seoTitle) : t("عنوان المقال", "Post title")}</p>
                  <p className="serp-desc">{desc ? (desc.length > 158 ? `${desc.slice(0, 155)}…` : desc) : t("أضف وصفًا تعريفيًا…", "Add a meta description…")}</p>
                </div>
              </div>

              {/* social preview */}
              <div>
                <span className="mb-2 block text-xs font-semibold text-ink">{t("معاينة المشاركة (واتساب · لينكدإن · فيسبوك)", "Share preview (WhatsApp · LinkedIn · Facebook)")}</span>
                <div className="og-card" dir={L.dir}>
                  <div className="og-img">{p.cover || seo.og_image ? <img src={seo.og_image || p.cover!} alt="" /> : <img src={`/og/${lang === "ar" ? "ar" : "en"}.jpg`} alt="" />}</div>
                  <div className="og-meta"><small dir="ltr">{siteHost || "sco-eg.com"}</small><b>{seo.og_title || seoTitle || t("عنوان المقال", "Post title")}</b><span>{seo.og_description || desc}</span></div>
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold text-ink">{t("مشكلات وتحسينات", "Problems & improvements")} <span className="text-muted">({issues.length})</span></p>
                <ul>{issues.map((c) => <CheckRow key={c.id} c={c} t={t} />)}</ul>
                {goods.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs font-semibold text-[#0f7a4a]">✓ {t("نقاط جيدة", "Good results")} ({goods.length})</summary>
                    <ul>{goods.map((c) => <CheckRow key={c.id} c={c} t={t} />)}</ul>
                  </details>
                )}
              </div>

              <details className="rounded-xl border border-rule p-3">
                <summary className="cursor-pointer text-xs font-semibold text-ink">{t("إعدادات متقدمة", "Advanced")}</summary>
                <div className="mt-3 grid gap-3 text-sm">
                  <label className="grid gap-1"><span className="text-xs text-muted">{t("عنوان المشاركة على الشبكات (اختياري)", "Social share title (optional)")}</span><input className="ed-input" value={seo.og_title ?? ""} onChange={(e) => setSeo({ og_title: e.target.value })} placeholder={seoTitle} maxLength={90} /></label>
                  <label className="grid gap-1"><span className="text-xs text-muted">{t("وصف المشاركة على الشبكات (اختياري)", "Social share description (optional)")}</span><textarea className="ed-input min-h-16" value={seo.og_description ?? ""} onChange={(e) => setSeo({ og_description: e.target.value })} placeholder={desc} maxLength={200} /></label>
                  <label className="grid gap-1"><span className="text-xs text-muted">{t("صورة المشاركة (إن اختلفت عن الغلاف)", "Share image (if different from the cover)")}</span><ImageInput value={seo.og_image ?? null} onChange={(v) => setSeo({ og_image: v ?? undefined })} /></label>
                  <label className="grid gap-1"><span className="text-xs text-muted">{t("رابط أساسي Canonical (اتركه فارغًا عادةً)", "Canonical URL (usually leave empty)")}</span><input dir="ltr" className="ed-input" value={seo.canonical ?? ""} onChange={(e) => setSeo({ canonical: e.target.value })} placeholder="https://" /></label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-[var(--blue)]" checked={Boolean(seo.noindex)} onChange={(e) => setSeo({ noindex: e.target.checked })} />{t("إخفاء من محركات البحث (noindex)", "Hide from search engines (noindex)")}</label>
                </div>
              </details>
            </div>
          )}

          {tab === "publish" && (
            <div className="grid gap-4 text-sm">
              <fieldset className="grid gap-2">
                <legend className="mb-1 text-xs font-semibold text-ink">{t("حالة المقال", "Status")}</legend>
                {([
                  ["draft", t("مسودة — غير ظاهر على الموقع", "Draft — not on the site")],
                  ["now", live ? t("منشور", "Published") : t("نشر الآن", "Publish now")],
                  ["schedule", t("جدولة لتاريخ لاحق", "Schedule for later")],
                ] as const).map(([k, lbl]) => (
                  <label key={k} className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 ${mode === k ? "border-blue bg-blue-wash" : "border-rule"}`}>
                    <input type="radio" name="mode" className="accent-[var(--blue)]" checked={mode === k} onChange={() => setMode(k)} />
                    {lbl}
                  </label>
                ))}
              </fieldset>
              {mode === "schedule" && (
                <label className="grid gap-1">
                  <span className="text-xs text-muted">{t("تاريخ ووقت النشر (توقيتك المحلي)", "Publish date & time (your local time)")}</span>
                  <input type="datetime-local" className="ed-input" value={when} min={toLocalInput(new Date().toISOString())} onChange={(e) => setWhen(e.target.value)} />
                </label>
              )}
              {p.publish_at && mode !== "draft" && <p className="text-xs text-muted">{t("تاريخ النشر", "Publish date")}: <b>{time(p.publish_at)}</b></p>}
              <div className="rounded-xl bg-paper-2 p-3">
                <p className="mb-2 text-xs font-semibold text-ink">{t("حالة الترجمات", "Translations")}</p>
                <ul className="grid gap-1.5">
                  {enabled.map((l) => {
                    const okT = Boolean(p.title?.[l.code]?.trim());
                    const okB = Boolean((p.body?.[l.code] as RichDoc | undefined)?.content?.length);
                    const okS = Boolean(p.seo?.[l.code]?.description);
                    return (
                      <li key={l.code} className="flex items-center justify-between text-xs">
                        <button type="button" className="font-medium text-ink hover:text-blue" onClick={() => setLang(l.code)}>{l.native_name}</button>
                        <span className="flex gap-1">
                          {[[okT, t("العنوان", "Title")], [okB, t("المحتوى", "Body")], [okS, "SEO"]].map(([ok, n]) => (
                            <span key={String(n)} className={`rounded px-1.5 py-0.5 ${ok ? "bg-[#e5f6ec] text-[#0f7a4a]" : "bg-surface text-faint"}`}>{ok ? "✓" : "○"} {n}</span>
                          ))}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-2 text-[0.7rem] text-muted">{t("لا يظهر المقال بلغة ما إلا إذا كُتب عنوانه ورابطه بها.", "A post appears in a language only once it has a title and slug in it.")}</p>
              </div>
              {editable && (
                <div className="flex flex-wrap gap-2 border-t border-rule pt-4">
                  <button type="button" className="rounded-full border border-rule px-3 py-1.5 text-xs hover:bg-paper-2" onClick={() => start(async () => { const r = await duplicatePost(p.id); if (show(r, t("تم إنشاء نسخة", "Duplicated")) && r.ok) router.push(`/admin/posts/${(r.data as { id: string }).id}`); })}>{t("تكرار المقال", "Duplicate")}</button>
                  {canEdit(role, "admin") && (
                    <button type="button" className="rounded-full border border-danger/30 px-3 py-1.5 text-xs text-danger hover:bg-danger/5" onClick={() => { if (confirm(t("حذف المقال نهائيًا؟", "Delete this post permanently?"))) start(async () => { if (show(await deletePost(p.id), t("تم الحذف", "Deleted"))) router.push("/admin/posts"); }); }}>{t("حذف", "Delete")}</button>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === "settings" && (
            <div className="grid gap-4 text-sm" lang={lang} dir={L.dir}>
              <div className="grid gap-1.5">
                <span className="text-xs font-semibold text-ink">{t("قالب عرض المقال", "Article layout")}</span>
                <div className="grid grid-cols-3 gap-2">
                  {LAYOUTS.map((lo) => (
                    <button key={lo.key} type="button" aria-pressed={(p.layout ?? "classic") === lo.key} onClick={() => set("layout", lo.key)} className={`grid gap-1.5 rounded-xl border-2 p-2 text-start ${(p.layout ?? "classic") === lo.key ? "border-blue bg-blue-wash" : "border-rule hover:border-rule-strong"}`}>
                      <span className="pe-layout" data-l={lo.key} aria-hidden="true"><i /><i /><i /></span>
                      <b className="text-xs text-ink">{t(...lo.label)}</b>
                      <span className="text-[0.68rem] leading-snug text-muted">{t(...lo.hint)}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-1.5">
                <span className="text-xs font-semibold text-ink">{t("صورة الغلاف", "Cover image")}</span>
                <ImageInput value={p.cover} onChange={(v) => set("cover", v)} />
                <input className="ed-input" value={p.cover_alt?.[lang] ?? ""} onChange={(e) => setL("cover_alt", e.target.value)} placeholder={t("وصف الصورة (نص بديل)", "Describe the image (alt text)")} />
                <span className="text-[0.7rem] text-muted">{t("المقاس المثالي 1200×630 بكسل.", "Ideal size 1200×630 px.")}</span>
              </div>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold text-ink">{t("التصنيف", "Category")}</span>
                <select className="ed-input" value={p.category_id ?? ""} onChange={(e) => set("category_id", e.target.value || null)}>
                  <option value="">—</option>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name?.[lang] || c.name?.ar || c.name?.en || c.slug}</option>)}
                </select>
              </label>
              <div className="grid gap-1.5">
                <span className="text-xs font-semibold text-ink">{t("الوسوم", "Tags")}</span>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tg) => {
                    const on = p.tag_ids.includes(tg.id);
                    return (
                      <button key={tg.id} type="button" onClick={() => set("tag_ids", on ? p.tag_ids.filter((x) => x !== tg.id) : [...p.tag_ids, tg.id])} className={`rounded-full px-3 py-1 text-xs ${on ? "bg-blue text-white" : "bg-paper-2 text-muted hover:text-ink"}`}>
                        {on ? "✓ " : "+ "}{tg.name?.[lang] || tg.name?.ar || tg.name?.en || tg.slug}
                      </button>
                    );
                  })}
                  {!tags.length && <span className="text-xs text-muted">{t("لا توجد وسوم بعد.", "No tags yet.")}</span>}
                </div>
              </div>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold text-ink">{t("الكاتب", "Author")}</span>
                <select className="ed-input" value={p.author_id ?? ""} onChange={(e) => set("author_id", e.target.value || null)}>
                  <option value="">—</option>
                  {authors.map((au) => <option key={au.id} value={au.id}>{au.name?.[lang] || au.name?.ar || au.name?.en || au.slug}</option>)}
                </select>
              </label>
              <Link href="/admin/taxonomy" className="text-xs text-blue hover:underline">{t("إدارة التصنيفات والوسوم والكُتّاب ←", "Manage categories, tags and authors →")}</Link>
            </div>
          )}

          {tab === "history" && (
            <div className="grid gap-3 text-sm">
              <p className="text-xs text-muted">{t("تُحفظ نسخة من المحتوى السابق عند كل حفظ يغيّره (آخر 20 نسخة). الاستعادة تضع النسخة في المحرر فقط؛ راجعها ثم احفظ.", "The previous content is kept each time a save changes it (last 20). Restoring puts that version in the editor only — review it, then save.")}</p>
              {autoAt && <p className="text-xs text-[#0f7a4a]">✓ {t("حُفظت المسودة تلقائيًا", "Draft autosaved")} · {time(autoAt)}</p>}
              {versions === null && <p className="text-xs text-muted">{t("جارٍ التحميل…", "Loading…")}</p>}
              {versions?.length === 0 && <p className="rounded-xl border border-dashed border-rule p-4 text-center text-xs text-muted">{t("لا توجد نسخ سابقة بعد.", "No earlier versions yet.")}</p>}
              <ul className="grid gap-2">
                {versions?.map((v) => {
                  const snap = v.snapshot as Partial<EditablePost>;
                  const title = (snap.title as L | undefined)?.[lang] || (snap.title as L | undefined)?.[def] || t("بدون عنوان", "Untitled");
                  return (
                    <li key={v.id} className="flex items-center gap-3 rounded-xl border border-rule p-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-ink">{title}</p>
                        <p className="text-xs text-muted">{time(v.created_at)}{v.author ? ` · ${v.author}` : ""}</p>
                      </div>
                      {editable && (
                        <button
                          type="button"
                          className="btn btn-ghost !min-h-8 !px-3 text-xs"
                          onClick={() => {
                            if (!confirm(t("وضع هذه النسخة في المحرر؟ لن يتغير الموقع حتى تحفظ.", "Put this version in the editor? Nothing changes on the site until you save."))) return;
                            setP((x) => ({ ...x, ...(snap as Partial<EditablePost>), id: x.id, status: x.status, publish_at: x.publish_at, updated_at: x.updated_at }));
                          }}
                        >
                          {t("استعادة", "Restore")}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {tab === "faq" && (
            <div className="grid gap-3 text-sm" lang={lang} dir={L.dir}>
              <p className="text-xs text-muted">{t("أسئلة وأجوبة في نهاية المقال، تُضاف كبيانات FAQ منظمة لمحركات البحث.", "Questions and answers at the end of the post, added as FAQ structured data for search engines.")}</p>
              {(p.faqs?.[lang] ?? []).map((f, i) => (
                <div key={i} className="grid gap-1.5 rounded-xl border border-rule p-3">
                  <input className="ed-input" value={f.q} placeholder={t("السؤال", "Question")} onChange={(e) => set("faqs", { ...p.faqs, [lang]: (p.faqs?.[lang] ?? []).map((x, k) => (k === i ? { ...x, q: e.target.value } : x)) })} />
                  <textarea className="ed-input min-h-16" value={f.a} placeholder={t("الإجابة", "Answer")} onChange={(e) => set("faqs", { ...p.faqs, [lang]: (p.faqs?.[lang] ?? []).map((x, k) => (k === i ? { ...x, a: e.target.value } : x)) })} />
                  <button type="button" className="justify-self-end text-xs text-danger" onClick={() => set("faqs", { ...p.faqs, [lang]: (p.faqs?.[lang] ?? []).filter((_, k) => k !== i) })}>{t("حذف", "Remove")}</button>
                </div>
              ))}
              <button type="button" className="rounded-xl border border-dashed border-rule-strong py-2.5 text-sm text-blue hover:bg-blue-wash" onClick={() => set("faqs", { ...p.faqs, [lang]: [...(p.faqs?.[lang] ?? []), { q: "", a: "" }] })}>+ {t("إضافة سؤال", "Add a question")}</button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
