import { Badge, ResponsiveTable } from "@/components/layout/PageHeader";
import type { MemberRow } from "@/lib/data";
import { formatCurrency, formatHours } from "@/lib/format";
import { initials, memberStatusStyle } from "../lib/member-presentation";
import type { MemberStats } from "../hooks/use-per-member-stats";

export function MemberList({
  members,
  perMember,
  selectedId,
  onSelect,
}: {
  members: MemberRow[];
  perMember: Map<string, MemberStats>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <ResponsiveTable>
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-[var(--background-tertiary)] text-xs uppercase tracking-widest text-[var(--text-muted)]">
          <tr>
            <th className="px-5 py-3 text-left font-medium">Membro</th>
            <th className="px-5 py-3 text-left font-medium">Cargo</th>
            <th className="px-5 py-3 text-left font-medium">Status</th>
            <th className="px-5 py-3 text-right font-medium">Semana</th>
            <th className="px-5 py-3 text-right font-medium">Receita/mês</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => {
            const s = perMember.get(m.id);
            const { label, tone } = memberStatusStyle(m, s?.today ?? 0);
            return (
              <tr
                key={m.id}
                onClick={() => onSelect(m.id)}
                className={`cursor-pointer border-t border-[var(--border)] hover:bg-[var(--surface-hover)] ${
                  selectedId === m.id ? "bg-[var(--surface-hover)]" : ""
                }`}
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary-soft)] text-xs font-semibold text-primary">
                      {initials(m.name)}
                    </div>
                    <span className="font-medium">{m.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-[var(--text-secondary)]">{m.role || "—"}</td>
                <td className="px-5 py-3">
                  <Badge tone={tone}>{label}</Badge>
                </td>
                <td className="px-5 py-3 text-right tabular-nums">{formatHours(s?.week ?? 0)}</td>
                <td className="px-5 py-3 text-right tabular-nums">
                  {formatCurrency(s?.revenue ?? 0)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </ResponsiveTable>
  );
}
