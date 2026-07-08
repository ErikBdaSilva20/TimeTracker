import { Mail, MapPin, Palmtree, Phone, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/layout/PageHeader";
import type { MemberRow } from "@/lib/data";
import { formatCurrency, formatDate, formatHours } from "@/lib/format";
import { initials, memberStatusStyle } from "../lib/member-presentation";
import { zeroMemberStats, type MemberStats } from "../hooks/use-per-member-stats";

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function ProfilePanel({
  member,
  stats,
  onClose,
  onEdit,
}: {
  member: MemberRow;
  stats?: MemberStats;
  onClose: () => void;
  onEdit: () => void;
}) {
  const s = stats ?? zeroMemberStats();
  const { dot, label, tone } = memberStatusStyle(member, s.today);
  const goal = member.weekly_goal || 0;
  const weekHours = s.week / 60;
  const pct = goal ? Math.min(100, (weekHours / goal) * 100) : 0;
  const maxDay = Math.max(1, ...s.weekByDay);

  return (
    <aside className="card-surface sticky top-6 h-fit self-start">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary-soft)] text-base font-semibold text-primary">
              {initials(member.name)}
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[var(--surface)] ${dot}`}
            />
          </div>
          <div>
            <div className="text-base font-semibold">{member.name}</div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <Badge tone={tone}>{label}</Badge>
              <span>{member.role || "—"}</span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 space-y-2 text-sm">
        <InfoRow icon={Mail} label={member.email || "—"} />
        <InfoRow icon={Phone} label="—" />
        <InfoRow icon={MapPin} label="—" />
        <InfoRow icon={Palmtree} label={`Data de entrada: ${formatDate(member.created_at)}`} />
      </div>

      {/* Weekly load donut */}
      <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--background-tertiary)] p-4">
        <div className="mb-3 text-xs font-medium uppercase tracking-widest text-[var(--text-muted)]">
          Carga semanal
        </div>
        <div className="flex items-center gap-4">
          <Donut pct={pct} />
          <div className="text-xs text-[var(--text-secondary)]">
            <div className="text-2xl font-semibold text-[var(--text-primary)]">
              {goal ? `${Math.round(pct)}%` : "—"}
            </div>
            <div className="mt-1">
              {formatHours(s.week)} / {goal}h
            </div>
            <div className="mt-0.5 text-[var(--text-muted)]">Meta semanal</div>
          </div>
        </div>
      </div>

      {/* Weekly bars */}
      <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--background-tertiary)] p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-xs font-medium uppercase tracking-widest text-[var(--text-muted)]">
            Horas da semana
          </div>
          <div className="text-xs text-[var(--text-secondary)]">{formatHours(s.week)}</div>
        </div>
        <div className="flex h-24 items-end gap-2">
          {s.weekByDay.map((mins, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-full w-full items-end">
                <div
                  className="w-full rounded-t-md bg-[var(--secondary)]/70"
                  style={{ height: `${(mins / maxDay) * 100}%` }}
                />
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">{WEEKDAYS[i]}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <MiniStat
          label="Valor-hora"
          value={member.hourly_rate ? formatCurrency(member.hourly_rate) : "—"}
        />
        <MiniStat label="Receita mês" value={formatCurrency(s.revenue)} />
      </div>

      <button
        onClick={onEdit}
        className="mt-5 w-full rounded-xl border border-[var(--border)] bg-[var(--background-tertiary)] py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
      >
        Editar membro
      </button>
    </aside>
  );
}

function InfoRow({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
      <Icon className="h-3.5 w-3.5 text-[var(--text-muted)]" />
      <span className="truncate">{label}</span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background-tertiary)] p-3">
      <div className="text-[10px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

function Donut({ pct }: { pct: number }) {
  const r = 32;
  const c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" className="shrink-0">
      <circle cx="44" cy="44" r={r} fill="none" stroke="var(--surface-hover)" strokeWidth="8" />
      <circle
        cx="44"
        cy="44"
        r={r}
        fill="none"
        stroke="var(--secondary)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={off}
        transform="rotate(-90 44 44)"
      />
    </svg>
  );
}
