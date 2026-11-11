"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { changeRole, inviteUser, removeUser, revokeInvite } from "@/app/actions/users";
import { useAdmin, useResult } from "../AdminContext";
import type { Role } from "@/lib/types";

type U = { id: string; email: string; full_name: string | null; role: Role; created_at: string };
type I = { id: string; email: string; role: Role; created_at: string; expires_at: string };

const ROLE_INFO: Record<Role, [string, string, string, string]> = {
  owner: ["المالك", "Owner", "كل الصلاحيات، ونقل الملكية.", "Everything, including ownership."],
  admin: ["مدير", "Admin", "كل المحتوى والإعدادات والمستخدمين.", "All content, settings and users."],
  editor: ["محرر", "Editor", "يكتب وينشر المحتوى والمقالات والصفحات.", "Writes and publishes content, posts and pages."],
  viewer: ["مشاهد", "Viewer", "يطّلع على اللوحة دون تعديل.", "Can look around without editing."],
};

export function UsersManager({ me, users, invites }: { me: string; myRole: Role; users: U[]; invites: I[] }) {
  const { t, locale } = useAdmin();
  const show = useResult();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("editor");
  const [link, setLink] = useState<string | null>(null);
  const fmt = (d: string) => new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB", { dateStyle: "medium" }).format(new Date(d));
  const R = (r: Role) => t(ROLE_INFO[r][0], ROLE_INFO[r][1]);

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-rule bg-[var(--solid)] p-5 sm:p-6">
        <h2 className="font-display text-lg text-ink">{t("دعوة مستخدم", "Invite someone")}</h2>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await inviteUser(email, role, locale);
              if (show(r, "") && r.ok) {
                const d = r.data as { link: string; emailed: boolean };
                setLink(d.link);
                setEmail("");
                router.refresh();
              }
            });
          }}
        >
          <input type="email" required dir="ltr" className="ed-input" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <select className="ed-input sm:!w-40" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {(["editor", "admin", "viewer"] as Role[]).map((r) => <option key={r} value={r}>{R(r)}</option>)}
          </select>
          <button disabled={pending} className="btn btn-primary !min-h-11">{t("إرسال الدعوة", "Send invite")}</button>
        </form>
        <p className="mt-2 text-xs text-muted">{t(ROLE_INFO[role][2], ROLE_INFO[role][3])}</p>
        {link && (
          <div className="mt-4 rounded-xl border border-blue/30 bg-blue-wash p-3 text-sm">
            <p className="text-ink">{t("أُنشئت الدعوة. إن لم يصل البريد، شارك هذا الرابط مباشرة (صالح 7 أيام):", "Invitation created. If the email doesn't arrive, share this link directly (valid 7 days):")}</p>
            <div className="mt-2 flex gap-2">
              <input readOnly dir="ltr" className="ed-input font-mono text-xs" value={link} onFocus={(e) => e.currentTarget.select()} />
              <button type="button" className="btn btn-ghost !min-h-10 !px-4 text-sm" onClick={() => navigator.clipboard.writeText(link)}>{t("نسخ", "Copy")}</button>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted">{t("الأعضاء", "Members")} ({users.length})</h2>
        <ul className="overflow-hidden rounded-2xl border border-rule bg-[var(--solid)]">
          {users.map((u) => {
            const locked = u.id === me || u.role === "owner";
            return (
              <li key={u.id} className="flex flex-wrap items-center gap-3 border-b border-rule px-4 py-3 last:border-b-0">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-wash font-semibold text-blue">{(u.full_name || u.email).slice(0, 1).toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{u.full_name || u.email} {u.id === me && <span className="text-xs text-muted">({t("أنت", "you")})</span>}</p>
                  <p className="truncate text-xs text-faint" dir="ltr">{u.email} · {fmt(u.created_at)}</p>
                </div>
                <select
                  className="ed-input !w-36"
                  value={u.role}
                  disabled={locked || pending}
                  onChange={(e) => {
                    const r = e.target.value as Role;
                    start(async () => { if (show(await changeRole(u.id, r), t("تم تحديث الصلاحية", "Role updated"))) router.refresh(); });
                  }}
                >
                  {(["viewer", "editor", "admin", ...(u.role === "owner" ? ["owner"] : [])] as Role[]).map((r) => <option key={r} value={r}>{R(r)}</option>)}
                </select>
                {!locked && u.role !== "owner" && (
                  <button type="button" className="rounded-full border border-danger/30 px-3 py-1.5 text-xs text-danger hover:bg-danger/5" onClick={() => { if (confirm(t(`إزالة ${u.email} من لوحة التحكم؟`, `Remove ${u.email} from the panel?`))) start(async () => { if (show(await removeUser(u.id), t("تمت الإزالة", "Removed"))) router.refresh(); }); }}>
                    {t("إزالة", "Remove")}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {invites.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted">{t("دعوات بانتظار القبول", "Pending invitations")}</h2>
          <ul className="overflow-hidden rounded-2xl border border-rule bg-[var(--solid)]">
            {invites.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-3 border-b border-rule px-4 py-3 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-ink" dir="ltr">{i.email}</p>
                  <p className="text-xs text-faint">{R(i.role)} · {t("تنتهي", "expires")} {fmt(i.expires_at)}</p>
                </div>
                <button type="button" className="rounded-full border border-rule px-3 py-1.5 text-xs hover:bg-paper-2" onClick={() => start(async () => { if (show(await revokeInvite(i.id), t("أُلغيت الدعوة", "Invitation revoked"))) router.refresh(); })}>{t("إلغاء الدعوة", "Revoke")}</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid gap-3 rounded-2xl bg-paper-2 p-5 text-sm sm:grid-cols-2">
        {(["owner", "admin", "editor", "viewer"] as Role[]).map((r) => (
          <div key={r}><b className="text-ink">{R(r)}</b><p className="text-muted">{t(ROLE_INFO[r][2], ROLE_INFO[r][3])}</p></div>
        ))}
      </section>
    </div>
  );
}
