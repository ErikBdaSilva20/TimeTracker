import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { startOfDay, startOfWeek } from "date-fns";
import {
  Plus,
  Search,
  Download,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Phone,
  MapPin,
  Users,
  Briefcase,
  Clock,
  AlertTriangle,
  Palmtree,
  Circle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  PageBody,
  EmptyState,
  Badge,
  FormField,
  ResponsiveTable,
} from "@/components/layout/PageHeader";
import { AnimatedParticles } from "@/components/AnimatedParticles";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  membersRepo,
  timeEntriesRepo,
  projectsRepo,
  type MemberRow,
  type TimeEntryRow,
} from "@/lib/data";
import { formatCurrency, formatHours, formatDate } from "@/lib/format";
import { calculateRevenue } from "@/lib/billing";
import { useConfirm } from "@/hooks/useConfirm";

/* ------------------------- helpers ------------------------- */

type MemberStatus = "online" | "offline" | "ausente";

function statusOf(m: MemberRow, todayMinutes: number): MemberStatus {
  if (!m.active) return "offline";
  if (todayMinutes > 0) return "online";
  return "ausente";
}

const statusStyle: Record<MemberStatus, { dot: string; label: string; tone: "primary" | "muted" | "secondary" }> = {
  online: { dot: "bg-primary", label: "Online", tone: "primary" },
  ausente: { dot: "bg-amber-400", label: "Ausente", tone: "secondary" },
  offline: { dot: "bg-slate-500", label: "Offline", tone: "muted" },
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/* ------------------------- screen ------------------------- */

export function TeamScreen() {
  const qc = useQueryClient();
  const membersQ = useQuery({ queryKey: ["members"], queryFn: () => membersRepo.list() });
  const entriesQ = useQuery({ queryKey: ["time_entries"], queryFn: () => timeEntriesRepo.list() });
  const projectsQ = useQuery({ queryKey: ["projects"], queryFn: () => projectsRepo.list() });

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MemberRow | null>(null);
  const { confirm, dialog } = useConfirm();

  const entries = entriesQ.data ?? [];
  const members = membersQ.data ?? [];
  const activeProjects = (projectsQ.data ?? []).filter((p) => p.status === "active").length;

  const today = startOfDay(new Date());
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // semana começa segunda
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  // Aggregate per member
  const perMember = useMemo(() => {
    const map = new Map<
      string,
      {
        today: number;
        week: number;
        month: number;
        revenue: number;
        projects: Set<string>;
        entries: TimeEntryRow[];
        weekByDay: number[]; // 0..6 (seg..dom) minutes
      }
    >();
    for (const e of entries) {
      const key = e.member_id || "";
      if (!key) continue;
      let cur = map.get(key);
      if (!cur) {
        cur = { today: 0, week: 0, month: 0, revenue: 0, projects: new Set(), entries: [], weekByDay: [0, 0, 0, 0, 0, 0, 0] };
        map.set(key, cur);
      }
      const d = new Date(e.date);
      if (d >= today) cur.today += e.duration_minutes;
      if (d >= weekStart) {
        cur.week += e.duration_minutes;
        const idx = (d.getDay() + 6) % 7;
        cur.weekByDay[idx] += e.duration_minutes;
      }
      if (d >= monthStart) {
        cur.month += e.duration_minutes;
        cur.revenue += calculateRevenue(e);
      }
      cur.entries.push(e);
      if (e.project_name) cur.projects.add(e.project_name);
    }
    return map;
  }, [entries, today, weekStart, monthStart]);

  // KPIs
  const totalMembers = members.length;
  const totalOnline = members.filter((m) => {
    const s = perMember.get(m.id);
    return statusOf(m, s?.today ?? 0) === "online";
  }).length;
  const totalHoursToday = Array.from(perMember.values()).reduce((a, v) => a + v.today, 0);
  const totalOverloaded = members.filter((m) => {
    const s = perMember.get(m.id);
    const goal = m.weekly_goal || 0;
    return goal > 0 && (s?.week ?? 0) / 60 > goal;
  }).length;
  // Schema only has a boolean `active` flag (no leave/vacation date range),
  // so this counts inactive members rather than a true "on vacation" status.
  const inactiveCount = members.filter((m) => !m.active).length;

  // Filters
  const roles = Array.from(new Set(members.map((m) => m.role).filter(Boolean))) as string[];
  const filtered = members.filter((m) => {
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (roleFilter && m.role !== roleFilter) return false;
    if (statusFilter) {
      const s = perMember.get(m.id);
      if (statusOf(m, s?.today ?? 0) !== statusFilter) return false;
    }
    return true;
  });

  const selected = selectedId ? members.find((m) => m.id === selectedId) ?? null : null;
  const selectedStats = selected ? perMember.get(selected.id) : undefined;

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("");
    setStatusFilter("");
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload: Partial<MemberRow> = {
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || "") || null,
      role: String(fd.get("role") || "") || null,
      hourly_rate: Number(fd.get("hourly_rate")) || null,
      weekly_goal: Number(fd.get("weekly_goal")) || null,
      active: fd.get("active") === "on",
    };
    try {
      if (editing) await membersRepo.update(editing.id, payload);
      else await membersRepo.create(payload);
      toast.success(editing ? "Membro atualizado" : "Membro criado");
      setShowForm(false);
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["members"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  };

  const onDelete = async (id: string) => {
    if (!(await confirm("Excluir membro?"))) return;
    await membersRepo.remove(id);
    if (selectedId === id) setSelectedId(null);
    qc.invalidateQueries({ queryKey: ["members"] });
    toast.success("Membro excluído");
  };

  const exportCSV = () => {
    const rows = [
      ["Nome", "Cargo", "E-mail", "Valor-hora", "Horas semana", "Receita mês", "Status"],
      ...filtered.map((m) => {
        const s = perMember.get(m.id);
        return [
          m.name,
          m.role ?? "",
          m.email ?? "",
          m.hourly_rate ? formatCurrency(m.hourly_rate) : "",
          formatHours(s?.week ?? 0),
          formatCurrency(s?.revenue ?? 0),
          statusOf(m, s?.today ?? 0),
        ];
      }),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `equipe-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {dialog}
      <div className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--background-secondary)]">
        <AnimatedParticles density={40} />
        <div className="relative flex flex-col gap-3 px-4 py-5 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-6 sm:py-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">Equipe</h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Gerencie membros, cargos e alocações de projetos.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
            >
              <Download className="h-4 w-4" /> <span className="hidden sm:inline">Exportar</span>
            </button>
            <button
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-[var(--primary-hover)]"
            >
              <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Adicionar membro</span><span className="sm:hidden">Novo</span>
            </button>
          </div>
        </div>
      </div>

      <PageBody>
        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <KpiCard icon={Users} label="Total de membros" value={totalMembers} hint="Todos os membros" tone="primary" />
          <KpiCard icon={Circle} label="Online" value={totalOnline} hint={`${totalMembers ? Math.round((totalOnline / totalMembers) * 100) : 0}% do time`} tone="secondary" />
          <KpiCard icon={Briefcase} label="Projetos ativos" value={activeProjects} hint="Em andamento" tone="primary" />
          <KpiCard icon={Clock} label="Horas hoje" value={formatHours(totalHoursToday)} hint="Somando o time" tone="secondary" />
          <KpiCard icon={AlertTriangle} label="Sobrecarregados" value={totalOverloaded} hint="Acima da meta" tone="danger" />
          <KpiCard icon={Palmtree} label="Inativos" value={inactiveCount} hint="Membros marcados como inativos" tone="secondary" />
        </div>

        {/* Search + filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por nome, cargo, projeto..."
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={roleFilter} onChange={setRoleFilter} placeholder="Cargo">
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
            <Select value={statusFilter} onChange={setStatusFilter} placeholder="Status">
              <option value="online">Online</option>
              <option value="ausente">Ausente</option>
              <option value="offline">Offline</option>
            </Select>
            {(search || roleFilter || statusFilter) && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 rounded-xl border border-transparent px-3 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="h-3.5 w-3.5" /> Limpar filtros
              </button>
            )}

            <div className="ml-auto inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 text-xs">
              {(["grid", "list"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`rounded-lg px-3 py-1.5 font-medium transition ${
                    view === v ? "bg-[var(--surface-hover)] text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                  }`}
                >
                  {v === "grid" ? "Grid" : "Lista"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Split layout: cards + profile panel */}
        <div className={`grid gap-6 ${selected ? "xl:grid-cols-[minmax(0,1fr)_380px]" : "grid-cols-1"}`}>
          <div>
            {membersQ.isLoading ? (
              <div className="card-surface">Carregando…</div>
            ) : filtered.length === 0 ? (
              <EmptyState
                title="Nenhum membro"
                description="Adicione membros da equipe para atribuir tasks e acompanhar horas."
              />
            ) : view === "grid" ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {filtered.map((m) => (
                  <MemberCard
                    key={m.id}
                    member={m}
                    stats={perMember.get(m.id)}
                    isSelected={selectedId === m.id}
                    onSelect={() => setSelectedId(m.id)}
                    onEdit={() => {
                      setEditing(m);
                      setShowForm(true);
                    }}
                    onDelete={() => onDelete(m.id)}
                  />
                ))}
              </div>
            ) : (
              <MemberList
                members={filtered}
                perMember={perMember}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            )}
          </div>

          {selected && (
            <ProfilePanel
              member={selected}
              stats={selectedStats}
              onClose={() => setSelectedId(null)}
              onEdit={() => {
                setEditing(selected);
                setShowForm(true);
              }}
            />
          )}
        </div>
      </PageBody>

      <Dialog
        open={showForm}
        onOpenChange={(o) => {
          setShowForm(o);
          if (!o) setEditing(null);
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar membro" : "Novo membro"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField name="name" label="Nome" required defaultValue={editing?.name} />
              <FormField name="email" label="E-mail" type="email" defaultValue={editing?.email ?? ""} />
              <FormField name="role" label="Cargo" defaultValue={editing?.role ?? ""} />
              <FormField
                name="hourly_rate"
                label="Valor-hora (R$)"
                type="number"
                defaultValue={editing?.hourly_rate ?? ""}
              />
              <FormField
                name="weekly_goal"
                label="Meta semanal (h)"
                type="number"
                defaultValue={editing?.weekly_goal ?? ""}
              />
              <label className="flex items-center gap-2 pt-6 text-sm">
                <input
                  name="active"
                  type="checkbox"
                  defaultChecked={editing ? editing.active : true}
                  className="h-4 w-4"
                />
                Membro ativo
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-[var(--primary-hover)]"
              >
                Salvar
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ------------------------- pieces ------------------------- */

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "primary",
}: {
  icon: typeof Users;
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

function Select({
  value,
  onChange,
  placeholder,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-secondary)] outline-none focus:border-primary"
    >
      <option value="">{placeholder}</option>
      {children}
    </select>
  );
}

function MemberCard({
  member,
  stats,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: {
  member: MemberRow;
  stats?: {
    today: number;
    week: number;
    month: number;
    revenue: number;
    projects: Set<string>;
  };
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const s = stats ?? { today: 0, week: 0, month: 0, revenue: 0, projects: new Set<string>() };
  const status = statusOf(member, s.today);
  const stStyle = statusStyle[status];
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
              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[var(--surface)] ${stStyle.dot}`}
            />
          </div>
          <div>
            <div className="font-medium">{member.name}</div>
            <div className="text-xs text-[var(--text-muted)]">{member.role || "—"}</div>
          </div>
        </div>
        <Badge tone={stStyle.tone}>{stStyle.label}</Badge>
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
          <div className={`mt-0.5 text-sm font-semibold ${efficiency >= 100 ? "text-primary" : ""}`}>
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

      <div
        className="mt-4 flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
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

function MemberList({
  members,
  perMember,
  selectedId,
  onSelect,
}: {
  members: MemberRow[];
  perMember: Map<string, { today: number; week: number; revenue: number; projects: Set<string> }>;
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
            const status = statusOf(m, s?.today ?? 0);
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
                  <Badge tone={statusStyle[status].tone}>{statusStyle[status].label}</Badge>
                </td>
                <td className="px-5 py-3 text-right tabular-nums">{formatHours(s?.week ?? 0)}</td>
                <td className="px-5 py-3 text-right tabular-nums">{formatCurrency(s?.revenue ?? 0)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </ResponsiveTable>
  );
}

function ProfilePanel({
  member,
  stats,
  onClose,
  onEdit,
}: {
  member: MemberRow;
  stats?: { today: number; week: number; month: number; revenue: number; weekByDay: number[] };
  onClose: () => void;
  onEdit: () => void;
}) {
  const s = stats ?? { today: 0, week: 0, month: 0, revenue: 0, weekByDay: [0, 0, 0, 0, 0, 0, 0] };
  const status = statusOf(member, s.today);
  const stStyle = statusStyle[status];
  const goal = member.weekly_goal || 0;
  const weekHours = s.week / 60;
  const pct = goal ? Math.min(100, (weekHours / goal) * 100) : 0;
  const maxDay = Math.max(1, ...s.weekByDay);
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  return (
    <aside className="card-surface sticky top-6 h-fit self-start">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary-soft)] text-base font-semibold text-primary">
              {initials(member.name)}
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[var(--surface)] ${stStyle.dot}`}
            />
          </div>
          <div>
            <div className="text-base font-semibold">{member.name}</div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <Badge tone={stStyle.tone}>{stStyle.label}</Badge>
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
              <div className="text-[10px] text-[var(--text-muted)]">{days[i]}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <MiniStat label="Valor-hora" value={member.hourly_rate ? formatCurrency(member.hourly_rate) : "—"} />
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

function InfoRow({ icon: Icon, label }: { icon: typeof Mail; label: string }) {
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
      <div className="text-[10px] font-medium uppercase tracking-widest text-[var(--text-muted)]">{label}</div>
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
