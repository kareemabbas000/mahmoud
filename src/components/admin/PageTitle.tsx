import Link from "next/link";

export function PageTitle({ title, intro, back, actions }: { title: string; intro?: string; back?: { href: string; label: string }; actions?: React.ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {back && <Link href={back.href} className="text-sm text-muted hover:text-ink">← {back.label}</Link>}
        <h1 className="display d-2 mt-1">{title}</h1>
        {intro && <p className="mt-2 max-w-2xl text-muted">{intro}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Forbidden({ ar }: { ar: boolean }) {
  return <p className="rounded-lg border border-danger/30 bg-danger/5 p-6 text-danger">{ar ? "ليست لديك صلاحية لعرض هذه الصفحة." : "You don't have permission to view this page."}</p>;
}
