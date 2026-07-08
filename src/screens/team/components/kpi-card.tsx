import type { LucideIcon } from "lucide-react";

export function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "primary",
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "primary" | "secondary" | "danger";
}) {
  const bg =
    tone === "primary"
      ? "bg-[var(--primary-soft)] text-primary"
      : tone === "secondary"
        ? "bg-[var(--secondary-soft)] text-[var(--secondary)]"
        : "bg-red-500/10 text-red-400";
  return (
    <div className="card-surface">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-[var(--text-muted)]">{label}</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
          {hint && <div className="mt-1 text-xs text-[var(--text-muted)]">{hint}</div>}
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
