import { getStaff } from "@/lib/admin/auth";
import { sessionClient } from "@/lib/supabase/clients";

const csv = (rows: Record<string, unknown>[], cols: string[]) =>
  "﻿" + [cols.join(","), ...rows.map((r) => cols.map((c) => `"${String(r[c] ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`).join(","))].join("\r\n");

export async function GET() {
  const staff = await getStaff();
  if (!staff) return new Response("Unauthorized", { status: 401 });
  const sb = (await sessionClient())!;
  const cols = ["created_at", "kind", "status", "name", "phone", "email", "company", "service", "job_title", "message", "locale", "source_url"];
  const { data, error } = await sb.from("enquiries").select(cols.join(",")).order("created_at", { ascending: false });
  if (error) return new Response(error.message, { status: 500 });
  return new Response(csv((data ?? []) as unknown as Record<string, unknown>[], cols), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="sco-enquiries-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" },
  });
}
