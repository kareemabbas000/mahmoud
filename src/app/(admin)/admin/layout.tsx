import type { Metadata, Viewport } from "next";
import "../../globals.css";
import { fontVars } from "@/app/fonts";
import { getAdminT } from "@/lib/admin/i18n";

export const metadata: Metadata = { title: { default: "SCO · Control panel", template: "%s · SCO panel" }, robots: { index: false, follow: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function AdminRoot({ children }: { children: React.ReactNode }) {
  const { locale, dir } = await getAdminT();
  return (
    <html lang={locale} dir={dir} className={`admin ${fontVars}`} data-theme="light" suppressHydrationWarning>
      <body className="admin-body min-h-dvh text-text">{children}</body>
    </html>
  );
}
