import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-start justify-between gap-4", className)}>
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ElementType;
  trend?: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        {Icon && <Icon className="size-4 text-muted-foreground" />}
      </div>
      <p className="mt-2 font-display text-3xl font-bold">{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {typeof trend === "number" && (
          <span className={cn("text-xs font-medium", trend >= 0 ? "text-success" : "text-danger")}>
            {trend >= 0 ? "+" : ""}
            {trend}%
          </span>
        )}
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border py-16 text-center">
      <Icon className="mx-auto mb-4 size-9 text-muted-foreground/40" />
      <h2 className="text-base font-semibold">{title}</h2>
      {description && <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
