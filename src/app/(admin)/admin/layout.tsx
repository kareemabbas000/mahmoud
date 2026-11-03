import type { Metadata, Viewport } from "next";
import "../../globals.css";
import { fontVars } from "@/app/fonts";
import { ThemeScript } from "@/components/site/ThemeScript";
import { getAdminT } from "@/lib/admin/i18n";

export const metadata: Metadata = { title: { default: "SCO · Control panel", template: "%s · SCO panel" }, robots: { index: false, follow: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function AdminRoot({ children }: { children: React.ReactNode }) {
  const { locale, dir } = await getAdminT();
  return (
    <html lang={locale} dir={dir} className={fontVars} suppressHydrationWarning>
      <head>
        <ThemeScript defaultMode="system" />
      </head>
      <body className="min-h-dvh bg-paper text-text">{children}</body>
    </html>
  );
}
