import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { sessionClient } from "@/lib/supabase/clients";
import type { Role } from "@/lib/types";

export type Staff = { id: string; email: string; role: Role; full_name: string | null };
const RANK: Record<Role, number> = { viewer: 1, editor: 2, admin: 3, owner: 4 };
export const atLeast = (role: Role, min: Role) => RANK[role] >= RANK[min];

/** Current signed-in staff member (null when signed out or without a profile). */
export const getStaff = cache(async (): Promise<Staff | null> => {
  const sb = await sessionClient();
  if (!sb) return null;
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return null;
  const { data } = await sb.from("profiles").select("id,email,role,full_name").eq("id", auth.user.id).maybeSingle();
  return (data as Staff | null) ?? null;
});

/** For pages: redirect to login when signed out; show a 403 view when the role is insufficient. */
export async function requirePage(min: Role = "viewer") {
  const staff = await getStaff();
  if (!staff) redirect("/admin/login");
  return { staff, allowed: atLeast(staff.role, min) };
}

export class ForbiddenError extends Error {}

/** For server actions: throws unless the caller holds at least `min`. RLS enforces the same rule in the database. */
export async function requireAction(min: Role) {
  const staff = await getStaff();
  if (!staff || !atLeast(staff.role, min)) throw new ForbiddenError("forbidden");
  const sb = (await sessionClient())!;
  return { staff, sb };
}
