import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Briefcase,
  Circle,
  Clock,
  Download,
  Palmtree,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";
import { AnimatedParticles } from "@/components/AnimatedParticles";
import { EmptyState, FormField, LoadingState, PageBody } from "@/components/layout/PageHeader";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDateBoundaries } from "@/hooks/use-date-boundaries";
import { useConfirm } from "@/hooks/useConfirm";
import {
  membersRepo,
  projectsRepo,
  timeEntriesRepo,
  type MemberRow,
  type TimeEntryRow,
} from "@/lib/data";
import { emptyArray } from "@/lib/empty";
import { formatCurrency, formatHours } from "@/lib/format";
import { runMutation } from "@/lib/mutations";
import { KpiCard } from "./components/kpi-card";
import { MemberCard } from "./components/member-card";
import { MemberList } from "./components/member-list";
import { ProfilePanel } from "./components/profile-panel";
import { usePerMemberStats } from "./hooks/use-per-member-stats";
import { memberStatusStyle } from "./lib/member-presentation";

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

  const entries = entriesQ.data ?? emptyArray<TimeEntryRow>();
  const members = membersQ.data ?? [];
  const activeProjects = (projectsQ.data ?? []).filter((p) => p.status === "active").length;

  const bounds = useDateBoundaries();
  const perMember = usePerMemberStats(entries, bounds);

  // KPIs
  const totalMembers = members.length;
  const totalOnline = members.filter((m) => {
    const s = perMember.get(m.id);
    return memberStatusStyle(m, s?.today ?? 0).status === "online";
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
      if (memberStatusStyle(m, s?.today ?? 0).status !== statusFilter) return false;
    }
    return true;
  });

  const selected = selectedId ? (members.find((m) => m.id === selectedId) ?? null) : null;
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
    await runMutation(
      () => (editing ? membersRepo.update(editing.id, payload) : membersRepo.create(payload)),
      {
        successMessage: editing ? "Membro atualizado" : "Membro criado",
        onSuccess: () => {
          setShowForm(false);
          setEditing(null);
          qc.invalidateQueries({ queryKey: ["members"] });
        },
      },
    );
  };

  const onDelete = async (id: string) => {
    if (!(await confirm("Excluir membro?"))) return;
    await runMutation(() => membersRepo.remove(id), {
      successMessage: "Membro excluído",
      onSuccess: () => {
        if (selectedId === id) setSelectedId(null);
        qc.invalidateQueries({ queryKey: ["members"] });
      },
    });
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
          memberStatusStyle(m, s?.today ?? 0).status,
        ];
      }),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
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
              <Plus className="h-4 w-4" />{" "}
              <span className="hidden sm:inline">Adicionar membro</span>
              <span className="sm:hidden">Novo</span>
            </button>
          </div>
        </div>
      </div>

      <PageBody>
        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            icon={Users}
            label="Total de membros"
            value={totalMembers}
            hint="Todos os membros"
            tone="primary"
          />
          <KpiCard
            icon={Circle}
            label="Online"
            value={totalOnline}
            hint={`${totalMembers ? Math.round((totalOnline / totalMembers) * 100) : 0}% do time`}
            tone="secondary"
          />
          <KpiCard
            icon={Briefcase}
            label="Projetos ativos"
            value={activeProjects}
            hint="Em andamento"
            tone="primary"
          />
          <KpiCard
            icon={Clock}
            label="Horas hoje"
            value={formatHours(totalHoursToday)}
            hint="Somando o time"
            tone="secondary"
          />
          <KpiCard
            icon={AlertTriangle}
            label="Sobrecarregados"
            value={totalOverloaded}
            hint="Acima da meta"
            tone="danger"
          />
          <KpiCard
            icon={Palmtree}
            label="Inativos"
            value={inactiveCount}
            hint="Membros marcados como inativos"
            tone="secondary"
          />
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
                    view === v
                      ? "bg-[var(--surface-hover)] text-[var(--text-primary)]"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  {v === "grid" ? "Grid" : "Lista"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Split layout: cards + profile panel */}
        <div
          className={`grid gap-6 ${selected ? "xl:grid-cols-[minmax(0,1fr)_380px]" : "grid-cols-1"}`}
        >
          <div>
            {membersQ.isLoading ? (
              <LoadingState />
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
              <FormField
                name="email"
                label="E-mail"
                type="email"
                defaultValue={editing?.email ?? ""}
              />
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
