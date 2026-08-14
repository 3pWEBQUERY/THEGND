"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavLink({
  href,
  children,
  className,
  exact,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative rounded-xl px-3.5 py-2 text-sm font-medium transition-colors",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      {children}
      {active && (
        <span className="absolute inset-x-3.5 -bottom-px h-0.5 rounded-xs brand-surface" />
      )}
    </Link>
  );
}
