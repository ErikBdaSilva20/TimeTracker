import type { ReactNode } from "react";

/**
 * Componentes básicos de layout de página.
 * ---
 * Padrão responsivo:
 *  • padding horizontal cresce em breakpoints (px-4 → sm:px-6 → lg:px-8);
 *  • header colapsa em coluna no mobile e volta a linha ≥ sm;
 *  • ações fazem wrap quando não cabem na linha.
 */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-[var(--border)] px-4 py-5 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:shrink-0">{actions}</div>}
    </div>
  );
}

export function PageBody({ children }: { children: ReactNode }) {
  return <div className="space-y-4 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-6 lg:px-8">{children}</div>;
}

export function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: "primary" | "secondary" | "muted";
}) {
  const dot =
    accent === "primary"
      ? "bg-primary"
      : accent === "secondary"
        ? "bg-[var(--secondary)]"
        : "bg-[var(--text-muted)]";
  return (
    <div className="card-surface card-surface-hover">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--text-muted)]">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        {label}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{value}</div>
      {hint && <div className="mt-1 text-xs text-[var(--text-muted)]">{hint}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card-surface flex flex-col items-center justify-center py-12 text-center sm:py-16">
      <div className="text-base font-medium">{title}</div>
      {description && (
        <p className="mt-2 max-w-md text-sm text-[var(--text-muted)]">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Badge({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "primary" | "secondary" | "muted" | "danger";
}) {
  const styles =
    tone === "primary"
      ? "bg-[var(--primary-soft)] text-primary border-[var(--primary-soft)]"
      : tone === "secondary"
        ? "bg-[var(--secondary-soft)] text-[var(--secondary)] border-[var(--secondary-soft)]"
        : tone === "danger"
          ? "bg-red-500/10 text-red-400 border-red-500/20"
          : "bg-[var(--surface-hover)] text-[var(--text-secondary)] border-[var(--border)]";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles}`}
    >
      {children}
    </span>
  );
}

/**
 * ResponsiveTable
 * ---
 * Wrapper padrão para tabelas: habilita scroll horizontal em telas estreitas
 * mantendo o layout tabular no desktop. Use assim:
 *
 *   <ResponsiveTable>
 *     <table className="w-full text-sm min-w-[720px]"> ... </table>
 *   </ResponsiveTable>
 */
export function ResponsiveTable({ children }: { children: ReactNode }) {
  return (
    <div className="card-surface overflow-hidden !p-0">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
