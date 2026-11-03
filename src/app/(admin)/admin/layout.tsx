import type { Metadata } from "next";
import "../../globals.css";
import { fontVars } from "@/app/fonts";

export const metadata: Metadata = { title: "SCO Control Panel", robots: { index: false, follow: false } };

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={fontVars} suppressHydrationWarning>
      <body className="min-h-dvh bg-paper">{children}</body>
    </html>
  );
}
