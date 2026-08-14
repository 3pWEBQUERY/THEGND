import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  pages,
  baseParams,
  basePath = "",
}: {
  page: number;
  pages: number;
  baseParams: URLSearchParams;
  basePath?: string;
}) {
  if (pages <= 1) return null;

  const href = (p: number) => {
    const params = new URLSearchParams(baseParams.toString());
    p === 1 ? params.delete("page") : params.set("page", String(p));
    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };

  const items: (number | "…")[] = [];
  const push = (n: number) => !items.includes(n) && items.push(n);
  push(1);
  if (page > 3) items.push("…");
  for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) push(i);
  if (page < pages - 2) items.push("…");
  if (pages > 1) push(pages);

  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Seitennavigation">
      <PageLink href={href(Math.max(1, page - 1))} disabled={page === 1} aria-label="Vorherige Seite">
        <ChevronLeft className="size-4" />
      </PageLink>

      {items.map((item, i) =>
        item === "…" ? (
          <span key={`gap-${i}`} className="px-1.5 text-sm text-muted-foreground">
            …
          </span>
        ) : (
          <PageLink key={item} href={href(item)} active={item === page}>
            {item}
          </PageLink>
        ),
      )}

      <PageLink href={href(Math.min(pages, page + 1))} disabled={page === pages} aria-label="Nächste Seite">
        <ChevronRight className="size-4" />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  active,
  disabled,
  children,
  ...props
}: {
  href: string;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
} & React.ComponentProps<"a">) {
  const className = cn(
    "grid h-10 min-w-10 place-items-center rounded-xl border px-3 text-sm font-medium transition-colors",
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-card text-foreground hover:border-foreground/30",
    disabled && "pointer-events-none opacity-40",
  );

  if (disabled) return <span className={className}>{children}</span>;
  return (
    <Link href={href} className={className} aria-current={active ? "page" : undefined} {...props}>
      {children}
    </Link>
  );
}
