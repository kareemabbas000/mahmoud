"use client";
/* eslint-disable react-hooks/refs -- dnd-kit useSortable returns ref callbacks/listeners by design */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useReducer, useRef, useState, useTransition } from "react";
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Icon } from "@/components/ui/Icon";
import { BLOCKS, GROUPS, blockDef } from "@/lib/admin/blocks";
import { discardDraft, publishPage, restoreVersion, saveDraft, saveTemplate, type BlockIn, type PageDraft } from "@/app/actions/pages";
import { canEdit, useAdmin, useResult } from "../AdminContext";
import { ImageInput } from "../Fields";
import { BlockForm } from "./BlockForm";

export type BuilderPage = { id: string; slug: string; kind: "system" | "custom"; published: boolean; live: PageDraft; draft: PageDraft | null; draft_updated_at: string | null };
type Version = { id: string; created_at: string; note: string | null };
type Hist = { draft: PageDraft; past: PageDraft[]; future: PageDraft[] };
type Act = { t: "commit"; fn: (d: PageDraft) => PageDraft } | { t: "undo" } | { t: "redo" } | { t: "reset"; d: PageDraft };
function reducer(s: Hist, a: Act): Hist {
  switch (a.t) {
    case "commit":
      return { draft: a.fn(s.draft), past: [...s.past.slice(-79), s.draft], future: [] };
    case "undo":
      return s.past.length ? { draft: s.past[s.past.length - 1]!, past: s.past.slice(0, -1), future: [s.draft, ...s.future] } : s;
    case "redo":
      return s.future.length ? { draft: s.future[0]!, past: [...s.past, s.draft], future: s.future.slice(1) } : s;
    case "reset":
      return { draft: a.d, past: [], future: [] };
  }
}

const uid = (t: string) => `${t}-${Math.random().toString(36).slice(2, 8)}`;
const summary = (b: BlockIn, lang: string) => {
  const p = b.props as Record<string, unknown>;
  for (const k of ["title", "eyebrow", "text", "caption", "cite"]) {
    const v = (p[k] as Record<string, string> | undefined)?.[lang];
    if (v) return v.replace(/\*/g, "");
  }
  return "";
};

function Row({ b, lang, selected, onSelect, onToggle, onDup, onDel, editable }: { b: BlockIn; lang: string; selected: boolean; onSelect: () => void; onToggle: () => void; onDup: () => void; onDel: () => void; editable: boolean }) {
  const { t } = useAdmin();
  const s = useSortable({ id: b.id, disabled: !editable });
  const def = blockDef(b.type);
  return (
    <li ref={s.setNodeRef} style={{ transform: CSS.Transform.toString(s.transform), transition: s.transition }} className={`pb-row ${selected ? "is-on" : ""} ${b.hidden ? "is-hidden" : ""} ${s.isDragging ? "is-drag" : ""}`}>
      {editable && <button type="button" className="pb-grip" aria-label={t("اسحب لإعادة الترتيب", "Drag to reorder")} {...s.attributes} {...s.listeners}>⋮⋮</button>}
      <button type="button" className="pb-row-main" onClick={onSelect}>
        <span className="pb-row-ic"><Icon name={def?.icon ?? "layers"} size={16} /></span>
        <span className="min-w-0">
          <b>{def ? t(...def.label) : b.type}</b>
          <small>{summary(b, lang) || "—"}</small>
        </span>
      </button>
      {editable && (
        <span className="pb-row-acts">
          <button type="button" title={b.hidden ? t("إظهار", "Show") : t("إخفاء", "Hide")} onClick={onToggle}>{b.hidden ? "◌" : "◉"}</button>
          <button type="button" title={t("تكرار", "Duplicate")} onClick={onDup}>⧉</button>
          <button type="button" title={t("حذف", "Delete")} onClick={onDel} className="hover:!text-danger">×</button>
        </span>
      )}
    </li>
  );
}

export function PageBuilder({ page, versions }: { page: BuilderPage; versions: Version[] }) {
  const { t, langs, role, locale: ui } = useAdmin();
  const show = useResult();
  const router = useRouter();
  const editable = canEdit(role, "editor");
  const enabled = langs.filter((l) => l.enabled);
  const [lang, setLang] = useState(langs.find((l) => l.is_default)?.code ?? "ar");
  const L = langs.find((l) => l.code === lang) ?? langs[0]!;
  const [hist, dispatch] = useReducer(reducer, { draft: page.draft ?? page.live, past: [], future: [] });
  const draft = hist.draft;
  const setDraft = (d: PageDraft) => dispatch({ t: "reset", d });
  const [hasDraft, setHasDraft] = useState(Boolean(page.draft));
  const [savedJson, setSavedJson] = useState(JSON.stringify(page.draft ?? page.live));
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">(page.draft ? "saved" : "idle");
  const [savedAt, setSavedAt] = useState(page.draft_updated_at);
  const [sel, setSel] = useState<string | null>(null);
  const [panel, setPanel] = useState<"blocks" | "add" | "page" | "versions">("blocks");
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [frameKey, setFrameKey] = useState(0);
  const [q, setQ] = useState("");
  const [pending, start] = useTransition();
  const frame = useRef<HTMLIFrameElement>(null);
  const dirty = JSON.stringify(draft) !== savedJson;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const commit = (next: PageDraft | ((d: PageDraft) => PageDraft)) => dispatch({ t: "commit", fn: typeof next === "function" ? next : () => next });
  const undo = () => dispatch({ t: "undo" });
  const redo = () => dispatch({ t: "redo" });

  /* autosave the draft, then refresh the preview */
  useEffect(() => {
    if (!editable || !dirty) return;
    const h = setTimeout(async () => {
      setState("saving");
      const snapshot = JSON.stringify(draft);
      const r = await saveDraft(page.id, draft);
      if (r.ok) {
        setSavedJson(snapshot);
        setHasDraft(true);
        setState("saved");
        setSavedAt((r.data as { at: string }).at);
        setFrameKey((k) => k + 1);
      } else {
        setState("error");
        show(r);
      }
    }, 1100);
    return () => clearTimeout(h);
  }, [draft, dirty, editable, page.id, show]);

  /* keyboard: undo / redo / save */
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !typing) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y" && !typing) { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  /* messages from the preview */
  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.origin !== location.origin) return;
      const d = e.data as { type?: string; id?: string };
      if (d?.type === "select" && d.id) {
        setSel(d.id);
        setPanel("blocks");
      }
    };
    window.addEventListener("message", on);
    return () => window.removeEventListener("message", on);
  }, []);
  const scrollPreview = (id: string) => frame.current?.contentWindow?.postMessage({ type: "scrollTo", id }, location.origin);

  const blocks = draft.blocks;
  const selBlock = blocks.find((b) => b.id === sel) ?? null;
  const selDef = selBlock ? blockDef(selBlock.type) : null;
  const setBlocks = (fn: (b: BlockIn[]) => BlockIn[]) => commit((d) => ({ ...d, blocks: fn(d.blocks) }));
  const addBlock = (type: string) => {
    const def = blockDef(type)!;
    const b: BlockIn = { id: uid(type), type, props: { ...(def.defaults ?? {}) } };
    setBlocks((list) => {
      const at = insertAt ?? list.length;
      return [...list.slice(0, at), b, ...list.slice(at)];
    });
    setSel(b.id);
    setPanel("blocks");
    setInsertAt(null);
  };
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    setBlocks((list) => arrayMove(list, list.findIndex((x) => x.id === e.active.id), list.findIndex((x) => x.id === e.over!.id)));
  };

  const publish = () => {
    const note = window.prompt(t("ملاحظة لهذه النسخة (اختياري)", "A note for this version (optional)"), "") ?? undefined;
    start(async () => {
      const r = await publishPage(page.id, draft, note);
      if (show(r, t("تم النشر — الصفحة محدّثة على الموقع", "Published — the page is live"))) {
        setHasDraft(false);
        setSavedJson(JSON.stringify(draft));
        setState("idle");
        router.refresh();
      }
    });
  };
  const discard = () => {
    if (!confirm(t("تجاهل كل التغييرات غير المنشورة والعودة للنسخة المنشورة؟", "Discard all unpublished changes and go back to the live version?"))) return;
    start(async () => {
      if (show(await discardDraft(page.id), t("أُعيدت الصفحة للنسخة المنشورة", "Back to the live version"))) {
        setDraft(page.live);
        setSavedJson(JSON.stringify(page.live));
        setHasDraft(false);
        setState("idle");
        setFrameKey((k) => k + 1);
      }
    });
  };

  const filtered = useMemo(() => BLOCKS.filter((b) => !q || `${b.label.join(" ")} ${b.hint.join(" ")} ${b.type}`.toLowerCase().includes(q.toLowerCase())), [q]);
  const time = (iso: string) => new Intl.DateTimeFormat(ui === "ar" ? "ar-EG-u-nu-latn" : "en-GB", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
  const seo = draft.seo?.[lang] ?? {};
  const setSeo = (patch: Record<string, unknown>) => commit((d) => ({ ...d, seo: { ...d.seo, [lang]: { ...(d.seo?.[lang] ?? {}), ...patch } } }));
  const previewSrc = `/${lang}/sco-preview/${page.id}?builder=1`;

  return (
    <div className="pb">
      {/* top bar */}
      <div className="pe-bar !mb-3">
        <Link href="/admin/pages" className="text-sm text-muted hover:text-ink">← {t("الصفحات", "Pages")}</Link>
        <b className="text-sm text-ink">{draft.title?.[lang] || page.slug || "/"}</b>
        <div className="pe-langs">
          {enabled.map((l) => (
            <button key={l.code} type="button" onClick={() => { setLang(l.code); setFrameKey((k) => k + 1); }} className={lang === l.code ? "is-on" : ""}>{l.native_name}</button>
          ))}
        </div>
        <span className="pe-state">
          {state === "saving" ? t("جارٍ حفظ المسودة…", "Saving draft…") : state === "error" ? <span className="text-danger">{t("تعذّر الحفظ", "Couldn't save")}</span> : hasDraft ? <span className="text-orange-text">● {t("مسودة غير منشورة", "Unpublished draft")}{savedAt ? ` · ${time(savedAt)}` : ""}</span> : <>✓ {t("مطابق للنسخة المنشورة", "Same as live")}</>}
        </span>
        <div className="ms-auto flex flex-wrap items-center gap-2">
          <button type="button" className="ed-btn" disabled={!hist.past.length} onClick={undo} title={t("تراجع", "Undo")}>↶</button>
          <button type="button" className="ed-btn" disabled={!hist.future.length} onClick={redo} title={t("إعادة", "Redo")}>↷</button>
          <a href={`/${lang}/sco-preview/${page.id}`} target="_blank" className="btn btn-ghost !min-h-10 !px-4 text-sm">{t("معاينة كاملة", "Full preview")} ↗</a>
          {editable && hasDraft && <button type="button" className="btn btn-ghost !min-h-10 !px-4 text-sm" onClick={discard} disabled={pending}>{t("تجاهل المسودة", "Discard draft")}</button>}
          {editable && (
            <button type="button" className="btn btn-primary !min-h-10 !px-5 text-sm" onClick={publish} disabled={pending || state === "saving" || (!hasDraft && !dirty)}>
              {t("نشر", "Publish")}
            </button>
          )}
        </div>
      </div>

      <div className="pb-grid">
        {/* side panel */}
        <aside className="pb-side">
          <div className="pe-tabs !grid-cols-3">
            <button type="button" className={panel === "blocks" || panel === "add" ? "is-on" : ""} onClick={() => { setPanel("blocks"); setSel(null); }}>{t("الأقسام", "Sections")}</button>
            <button type="button" className={panel === "page" ? "is-on" : ""} onClick={() => setPanel("page")}>{t("الصفحة وSEO", "Page & SEO")}</button>
            <button type="button" className={panel === "versions" ? "is-on" : ""} onClick={() => setPanel("versions")}>{t("النسخ", "Versions")}</button>
          </div>

          {panel === "blocks" && !selBlock && (
            <>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                  <ol className="grid gap-1.5">
                    {blocks.map((b, i) => (
                      <div key={b.id}>
                        <Row
                          b={b}
                          lang={lang}
                          selected={sel === b.id}
                          editable={editable}
                          onSelect={() => { setSel(b.id); scrollPreview(b.id); }}
                          onToggle={() => setBlocks((l) => l.map((x) => (x.id === b.id ? { ...x, hidden: !x.hidden } : x)))}
                          onDup={() => setBlocks((l) => { const c = { ...structuredClone(b), id: uid(b.type) }; return [...l.slice(0, i + 1), c, ...l.slice(i + 1)]; })}
                          onDel={() => { if (confirm(t("حذف هذا القسم؟", "Delete this section?"))) setBlocks((l) => l.filter((x) => x.id !== b.id)); }}
                        />
                        {editable && <button type="button" className="pb-insert" onClick={() => { setInsertAt(i + 1); setPanel("add"); }} title={t("إدراج قسم هنا", "Insert a section here")}>+</button>}
                      </div>
                    ))}
                  </ol>
                </SortableContext>
              </DndContext>
              {editable && (
                <div className="mt-3 grid gap-2">
                  <button type="button" className="rounded-xl border border-dashed border-rule-strong py-3 text-sm font-semibold text-blue hover:bg-blue-wash" onClick={() => { setInsertAt(null); setPanel("add"); }}>+ {t("إضافة قسم", "Add a section")}</button>
                  <button type="button" className="text-xs text-muted hover:text-ink" onClick={() => { const n = window.prompt(t("اسم القالب", "Template name")); if (n) start(async () => { show(await saveTemplate({ [ui]: n }, blocks), t("حُفظ كقالب", "Saved as a template")); }); }}>
                    ★ {t("حفظ ترتيب الأقسام كقالب لصفحات جديدة", "Save this layout as a template for new pages")}
                  </button>
                </div>
              )}
            </>
          )}

          {panel === "blocks" && selBlock && (
            <div>
              <button type="button" className="mb-3 text-sm text-muted hover:text-ink" onClick={() => setSel(null)}>← {t("كل الأقسام", "All sections")}</button>
              <div className="mb-4 flex items-center gap-3">
                <span className="pb-row-ic !size-10"><Icon name={selDef?.icon ?? "layers"} size={18} /></span>
                <div>
                  <p className="font-semibold text-ink">{selDef ? t(...selDef.label) : selBlock.type}</p>
                  <p className="text-xs text-muted">{selDef ? t(...selDef.hint) : ""}</p>
                </div>
              </div>
              {selDef ? (
                <fieldset disabled={!editable} lang={lang} dir={L.dir}>
                  <BlockForm fields={selDef.fields} props={selBlock.props} lang={lang} dir={L.dir} onChange={(p) => setBlocks((l) => l.map((x) => (x.id === selBlock.id ? { ...x, props: p } : x)))} />
                </fieldset>
              ) : (
                <p className="text-sm text-muted">{t("هذا القسم لا يحتوي إعدادات قابلة للتعديل.", "This section has no editable settings.")}</p>
              )}
            </div>
          )}

          {panel === "add" && (
            <div>
              <button type="button" className="mb-3 text-sm text-muted hover:text-ink" onClick={() => setPanel("blocks")}>← {t("رجوع", "Back")}</button>
              <input autoFocus className="ed-input mb-3" placeholder={t("ابحث: صورة، أسئلة، فريق…", "Search: image, FAQ, team…")} value={q} onChange={(e) => setQ(e.target.value)} />
              {GROUPS.map((g) => {
                const list = filtered.filter((b) => b.group === g.key);
                if (!list.length) return null;
                return (
                  <div key={g.key} className="mb-4">
                    <p className="mb-1.5 text-[0.7rem] font-bold text-faint">{t(...g.label)}</p>
                    <div className="grid gap-1.5">
                      {list.map((b) => {
                        const used = b.single && blocks.some((x) => x.type === b.type);
                        return (
                          <button key={b.type} type="button" disabled={used} onClick={() => addBlock(b.type)} className="ed-block-item border border-rule disabled:opacity-40">
                            <span className="ed-block-ic"><Icon name={b.icon} size={18} /></span>
                            <span><b>{t(...b.label)}</b><small>{t(...b.hint)}</small></span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {panel === "page" && (
            <fieldset disabled={!editable} className="grid gap-4 text-sm" lang={lang} dir={L.dir}>
              <label className="grid gap-1"><span className="text-xs font-semibold text-ink">{t("عنوان الصفحة", "Page title")}</span><input className="ed-input" value={draft.title?.[lang] ?? ""} onChange={(e) => commit((d) => ({ ...d, title: { ...d.title, [lang]: e.target.value } }))} /></label>
              <div className="rounded-xl bg-paper-2 px-3 py-2 text-xs text-muted" dir="ltr">/{lang}/{page.slug}{page.kind === "system" && <span className="ms-2">· {t("صفحة نظام: الرابط ثابت", "system page: fixed address")}</span>}</div>
              <label className="grid gap-1">
                <span className="flex justify-between text-xs"><b className="text-ink">{t("عنوان SEO", "SEO title")}</b><span className="tnum text-muted">{(seo.title ?? "").length}/60</span></span>
                <input className="ed-input" value={seo.title ?? ""} placeholder={draft.title?.[lang]} onChange={(e) => setSeo({ title: e.target.value })} />
              </label>
              <label className="grid gap-1">
                <span className="flex justify-between text-xs"><b className="text-ink">{t("الوصف التعريفي", "Meta description")}</b><span className="tnum text-muted">{(seo.description ?? "").length}/160</span></span>
                <textarea className="ed-input min-h-24" value={seo.description ?? ""} onChange={(e) => setSeo({ description: e.target.value })} />
              </label>
              <div className="serp" dir={L.dir}>
                <div className="serp-site"><span className="serp-fav">S</span><span><b>SCO</b><small dir="ltr">sco-eg.com › {lang} › {page.slug}</small></span></div>
                <p className="serp-title">{seo.title || draft.title?.[lang] || "—"}</p>
                <p className="serp-desc">{seo.description || t("أضف وصفًا تعريفيًا…", "Add a meta description…")}</p>
              </div>
              <label className="grid gap-1"><span className="text-xs font-semibold text-ink">{t("صورة المشاركة", "Share image")}</span><ImageInput value={(seo.og_image as string) ?? null} onChange={(v) => setSeo({ og_image: v ?? undefined })} /></label>
              <label className="flex items-center gap-2"><input type="checkbox" className="size-4 accent-[var(--blue)]" checked={Boolean(seo.noindex)} onChange={(e) => setSeo({ noindex: e.target.checked })} />{t("إخفاء من محركات البحث (noindex)", "Hide from search engines (noindex)")}</label>
            </fieldset>
          )}

          {panel === "versions" && (
            <div className="grid gap-2 text-sm">
              <p className="text-xs text-muted">{t("تُحفظ نسخة من الصفحة قبل كل نشر. الاستعادة تضعها في المسودة لتراجعها قبل النشر.", "A copy is kept before every publish. Restoring puts it in the draft so you can review it before publishing.")}</p>
              {versions.length === 0 && <p className="text-muted">{t("لا توجد نسخ سابقة بعد.", "No earlier versions yet.")}</p>}
              {versions.map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-2 rounded-xl border border-rule px-3 py-2">
                  <span><b className="text-ink">{time(v.created_at)}</b>{v.note && <span className="block text-xs text-muted">{v.note}</span>}</span>
                  {editable && (
                    <button type="button" className="rounded-full border border-rule px-3 py-1 text-xs hover:bg-paper-2" onClick={() => start(async () => { const r = await restoreVersion(page.id, v.id); if (show(r, t("استُعيدت النسخة في المسودة", "Version restored into the draft")) && r.ok) { const d = (r.data as { draft: PageDraft }).draft; setDraft(d); setSavedJson(JSON.stringify(d)); setHasDraft(true); setFrameKey((k) => k + 1); } })}>
                      {t("استعادة", "Restore")}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* live preview */}
        <section className="pb-stage">
          <div className="pb-stage-bar">
            {(["desktop", "tablet", "mobile"] as const).map((d) => (
              <button key={d} type="button" className={device === d ? "is-on" : ""} onClick={() => setDevice(d)}>{{ desktop: t("كمبيوتر", "Desktop"), tablet: t("تابلت", "Tablet"), mobile: t("موبايل", "Mobile") }[d]}</button>
            ))}
            <span className="ms-auto text-xs text-muted">{t("اضغط على أي قسم في المعاينة لتعديله", "Click any section in the preview to edit it")}</span>
          </div>
          <div className="pb-frame-wrap">
            {hasDraft || page.live.blocks.length ? (
              <iframe key={`${frameKey}-${lang}`} ref={frame} title={t("معاينة مباشرة", "Live preview")} src={hasDraft ? previewSrc : `${previewSrc}&src=live`} className={`pb-frame is-${device}`} />
            ) : (
              <p className="p-10 text-center text-muted">{t("أضف قسمًا لبدء المعاينة.", "Add a section to start the preview.")}</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
