"use client";

import { useTransition } from "react";
import { deleteSubscriber, setSubscriberStatus } from "@/app/actions/inbox";
import { canEdit, useAdmin, useResult } from "./AdminContext";

export function SubscriberActions({ id, status }: { id: string; status: string }) {
  const { t, role } = useAdmin();
  const show = useResult();
  const [pending, start] = useTransition();
  if (!canEdit(role, "admin")) return null;
  return (
    <div className="flex justify-end gap-2">
      {status !== "unsubscribed" && <button type="button" disabled={pending} className="text-xs text-muted hover:text-ink" onClick={() => start(async () => { show(await setSubscriberStatus(id, "unsubscribed"), t("تم إلغاء الاشتراك", "Unsubscribed")); })}>{t("إلغاء الاشتراك", "Unsubscribe")}</button>}
      <button type="button" disabled={pending} className="text-xs text-danger" onClick={() => start(async () => { if (confirm(t("حذف المشترك نهائيًّا؟", "Delete subscriber permanently?"))) show(await deleteSubscriber(id), t("تم الحذف", "Deleted")); })}>{t("حذف", "Delete")}</button>
    </div>
  );
}
