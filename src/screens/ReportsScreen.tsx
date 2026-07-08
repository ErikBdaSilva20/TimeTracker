import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { PageBody, PageHeader, StatCard, EmptyState } from "@/components/layout/PageHeader";
import {
  timeEntriesRepo,
  clientsRepo,
  projectsRepo,
  membersRepo,
} from "@/lib/data";
import { formatCurrency, formatDate, formatHours } from "@/lib/format";

type GroupBy = "project" | "client" | "member" | "task";

export function ReportsScreen() {
  const entriesQ = useQuery({ queryKey: ["time_entries"], queryFn: () => timeEntriesRepo.list() });
  const clientsQ = useQuery({ queryKey: ["clients"], queryFn: () => clientsRepo.list() });
  const projectsQ = useQuery({ queryKey: ["projects"], queryFn: () => projectsRepo.list() });
  const membersQ = useQuery({ queryKey: ["members"], queryFn: () => membersRepo.list() });

  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today.toISOString().slice(0, 10));
  const [clientId, setClientId] = useState("all");
  const [projectId, setProjectId] = useState("all");
  const [memberId, setMemberId] = useState("all");
  const [billableFilter, setBillableFilter] = useState<"all" | "billable" | "nonbillable">("all");
  const [groupBy, setGroupBy] = useState<GroupBy>("project");

  const filtered = useMemo(() => {
    return (entriesQ.data ?? []).filter((e) => {
      if (from && e.date < from) return false;
      if (to && e.date > to) return false;
      if (clientId !== "all" && e.client_id !== clientId) return false;
      if (projectId !== "all" && e.project_id !== projectId) return false;
      if (memberId !== "all" && e.member_id !== memberId) return false;
      if (billableFilter === "billable" && !e.billable) return false;
      if (billableFilter === "nonbillable" && e.billable) return false;
      return true;
    });
  }, [entriesQ.data, from, to, clientId, projectId, memberId, billableFilter]);

  const totals = useMemo(() => {
    const minutes = filtered.reduce((a, e) => a + (e.duration_minutes || 0), 0);
    const billableMin = filtered
      .filter((e) => e.billable)
      .reduce((a, e) => a + (e.duration_minutes || 0), 0);
    const revenue = filtered.reduce(
      (a, e) => a + ((e.duration_minutes || 0) / 60) * (e.hour_rate || 0) * (e.billable ? 1 : 0),
      0,
    );
    return { minutes, billableMin, revenue, count: filtered.length };
  }, [filtered]);

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { key: string; label: string; minutes: number; revenue: number; count: number }
    >();
    for (const e of filtered) {
      let key = "—";
      let label = "—";
      if (groupBy === "project") {
        key = e.project_id || "none";
        label = e.project_name || "Sem projeto";
      } else if (groupBy === "client") {
        key = e.client_id || "none";
        label = e.client_name || "Sem cliente";
      } else if (groupBy === "member") {
        key = e.member_id || "none";
        label = e.member_name || "Sem membro";
      } else if (groupBy === "task") {
        key = e.task_id || "none";
        label = e.task_name || "Sem task";
      }
      const cur = map.get(key) ?? { key, label, minutes: 0, revenue: 0, count: 0 };
      cur.minutes += e.duration_minutes || 0;
      cur.revenue += ((e.duration_minutes || 0) / 60) * (e.hour_rate || 0) * (e.billable ? 1 : 0);
      cur.count += 1;
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.minutes - a.minutes);
  }, [filtered, groupBy]);

  const exportCSV = () => {
    const header = [
      "date",
      "client",
      "project",
      "task",
      "member",
      "duration_min",
      "billable",
      "hour_rate",
      "notes",
    ];
    const rows = filtered.map((e) =>
      [
        e.date,
        e.client_name,
        e.project_name,
        e.task_name,
        e.member_name,
        e.duration_minutes,
        e.billable ? "yes" : "no",
        e.hour_rate ?? "",
        (e.notes || "").replace(/[\r\n,]/g, " "),
      ].join(","),
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timeflow-report-${from}_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        title="Relatórios"
        description="Filtre por período, cliente, projeto e membro. Exporte para CSV."
        actions={
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-3.5 py-2 text-sm font-medium hover:bg-[var(--surface-hover)]"
          >
            <Download className="h-4 w-4" /> Exportar CSV
          </button>
        }
      />
      <PageBody>
        <div className="card-surface grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <FilterField label="De">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </FilterField>
          <FilterField label="Até">
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </FilterField>
          <FilterField label="Cliente">
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            >
              <option value="all">Todos</option>
              {(clientsQ.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Projeto">
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            >
              <option value="all">Todos</option>
              {(projectsQ.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Membro">
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            >
              <option value="all">Todos</option>
              {(membersQ.data ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Faturamento">
            <select
              value={billableFilter}
              onChange={(e) => setBillableFilter(e.target.value as typeof billableFilter)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            >
              <option value="all">Todos</option>
              <option value="billable">Faturáveis</option>
              <option value="nonbillable">Não faturáveis</option>
            </select>
          </FilterField>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard label="Total" value={formatHours(totals.minutes)} hint={`${totals.count} registros`} accent="primary" />
          <StatCard label="Faturáveis" value={formatHours(totals.billableMin)} accent="secondary" />
          <StatCard
            label="% faturável"
            value={`${totals.minutes ? Math.round((totals.billableMin / totals.minutes) * 100) : 0}%`}
          />
          <StatCard label="Receita" value={formatCurrency(totals.revenue)} accent="primary" />
        </div>

        <div className="card-surface">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold">Agrupamento</h3>
            <div className="flex gap-1">
              {(["project", "client", "member", "task"] as GroupBy[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGroupBy(g)}
                  className={`rounded-lg border px-3 py-1.5 text-xs capitalize ${
                    groupBy === g
                      ? "border-primary bg-[var(--primary-soft)] text-primary"
                      : "border-[var(--border)] text-[var(--text-secondary)]"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          {grouped.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Sem dados no filtro selecionado.</p>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-[var(--text-muted)]">
                <tr className="text-left text-xs uppercase tracking-widest">
                  <th className="py-2 font-medium">{groupBy}</th>
                  <th className="py-2 font-medium">Registros</th>
                  <th className="py-2 font-medium">Horas</th>
                  <th className="py-2 font-medium">Receita</th>
                  <th className="py-2 font-medium">Distribuição</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map((row) => {
                  const pct = totals.minutes ? (row.minutes / totals.minutes) * 100 : 0;
                  return (
                    <tr key={row.key} className="border-t border-[var(--border)]">
                      <td className="py-3 font-medium">{row.label}</td>
                      <td className="py-3 text-[var(--text-secondary)]">{row.count}</td>
                      <td className="py-3">{formatHours(row.minutes)}</td>
                      <td className="py-3">{formatCurrency(row.revenue)}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-32 rounded-full bg-[var(--surface-hover)]">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-[var(--text-muted)]">
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}
        </div>

        <div className="card-surface">
          <h3 className="mb-4 text-base font-semibold">Registros</h3>
          {filtered.length === 0 ? (
            <EmptyState title="Sem registros" description="Ajuste os filtros para ver dados." />
          ) : (
            <div className="max-h-[420px] overflow-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="sticky top-0 bg-[var(--background-tertiary)] text-xs uppercase tracking-widest text-[var(--text-muted)]">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Data</th>
                    <th className="px-3 py-2 text-left font-medium">Cliente / Projeto</th>
                    <th className="px-3 py-2 text-left font-medium">Task</th>
                    <th className="px-3 py-2 text-left font-medium">Membro</th>
                    <th className="px-3 py-2 text-left font-medium">Horas</th>
                    <th className="px-3 py-2 text-left font-medium">Fatur.</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered
                    .slice()
                    .sort((a, b) => (a.date < b.date ? 1 : -1))
                    .map((e) => (
                      <tr key={e.id} className="border-t border-[var(--border)]">
                        <td className="px-3 py-2">{formatDate(e.date)}</td>
                        <td className="px-3 py-2">
                          <div className="font-medium">{e.project_name || "—"}</div>
                          <div className="text-xs text-[var(--text-muted)]">{e.client_name}</div>
                        </td>
                        <td className="px-3 py-2 text-[var(--text-secondary)]">
                          {e.task_name || "—"}
                        </td>
                        <td className="px-3 py-2 text-[var(--text-secondary)]">
                          {e.member_name || "—"}
                        </td>
                        <td className="px-3 py-2">{formatHours(e.duration_minutes)}</td>
                        <td className="px-3 py-2 text-xs">
                          {e.billable ? formatCurrency(
                            ((e.duration_minutes || 0) / 60) * (e.hour_rate || 0),
                          ) : "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PageBody>
    </>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
        {label}
      </label>
      {children}
    </div>
  );
}
