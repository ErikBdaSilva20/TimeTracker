import { useState } from "react";
import { MessageSquare, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/layout/PageHeader";
import type { MemberRow } from "@/lib/data";
import { formatHours } from "@/lib/format";
import { initials, memberStatusStyle } from "../lib/member-presentation";
import { zeroMemberStats, type MemberStats } from "../hooks/use-per-member-stats";

export function MemberCard({
  member,
  stats,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: {
  member: MemberRow;
  stats?: MemberStats;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const s = stats ?? zeroMemberStats();
  const { dot, label, tone } = memberStatusStyle(member, s.today);
  const goal = member.weekly_goal || 0;
  const weekHours = s.week / 60;
  const pct = goal ? Math.min(100, (weekHours / goal) * 100) : 0;
  const efficiency = goal ? Math.min(999, Math.round((weekHours / goal) * 100)) : 0;
  const [menuOpen, setMenuOpen] = useState(false);
  const projectTags = Array.from(s.projects).slice(0, 3);
  const overflow = s.projects.size - projectTags.length;

  return (
    <div
      onClick={onSelect}
      className={`card-surface card-surface-hover cursor-pointer ${
        isSelected ? "ring-2 ring-primary/60" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary-soft)] text-sm font-semibold text-primary">
              {initials(member.name)}
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[var(--surface)] ${dot}`}
            />
          </div>
          <div>
            <div className="font-medium">{member.name}</div>
            <div className="text-xs text-[var(--text-muted)]">{member.role || "—"}</div>
          </div>
        </div>
        <Badge tone={tone}>{label}</Badge>
      </div>

      {projectTags.length > 0 && (
        <div className="mt-4">
          <div className="mb-1.5 text-[10px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
            Projetos
          </div>
          <div className="flex flex-wrap gap-1.5">
            {projectTags.map((p) => (
              <span
                key={p}
                className="rounded-md border border-[var(--border)] bg-[var(--background-tertiary)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)]"
              >
                {p}
              </span>
            ))}
            {overflow > 0 && (
              <span className="rounded-md border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">
                +{overflow}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
        <div>
          <div className="text-[var(--text-muted)]">Hoje</div>
          <div className="mt-0.5 text-sm font-semibold">{formatHours(s.today)}</div>
        </div>
        <div>
          <div className="text-[var(--text-muted)]">Semana</div>
          <div className="mt-0.5 text-sm font-semibold">{formatHours(s.week)}</div>
        </div>
        <div>
          <div className="text-[var(--text-muted)]">Eficiência</div>
          <div
            className={`mt-0.5 text-sm font-semibold ${efficiency >= 100 ? "text-primary" : ""}`}
          >
            {goal ? `${efficiency}%` : "—"}
          </div>
        </div>
      </div>

      {goal > 0 && (
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)]">Carga semanal</span>
            <span className="text-[var(--text-secondary)]">
              {formatHours(s.week)} / {goal}h
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--surface-hover)]">
            <div
              className={`h-full rounded-full ${pct >= 100 ? "bg-red-400" : "bg-primary"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onSelect}
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background-tertiary)] py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
        >
          Ver perfil
        </button>
        <button
          title="Enviar mensagem"
          className="rounded-lg border border-[var(--border)] p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <MessageSquare className="h-3.5 w-3.5" />
        </button>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="rounded-lg border border-[var(--border)] p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 w-32 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-1 text-xs shadow-lg">
              <button
                onClick={() => {
                  onEdit();
                  setMenuOpen(false);
                }}
                className="block w-full rounded-md px-2 py-1.5 text-left hover:bg-[var(--surface-hover)]"
              >
                Editar
              </button>
              <button
                onClick={() => {
                  onDelete();
                  setMenuOpen(false);
                }}
                className="block w-full rounded-md px-2 py-1.5 text-left text-red-400 hover:bg-red-500/10"
              >
                Excluir
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
