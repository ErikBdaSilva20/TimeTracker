import { LoadingState, PageBody, PageHeader, StatCard } from "@/components/layout/PageHeader";
import { useDateBoundaries } from "@/hooks/use-date-boundaries";
import { calculateRevenue } from "@/lib/billing";
import { projectsRepo, timeEntriesRepo, type ProjectRow, type TimeEntryRow } from "@/lib/data";
import { emptyArray } from "@/lib/empty";
import { formatCurrency, formatHours } from "@/lib/format";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const sumMinutes = (rows: TimeEntryRow[]) =>
  rows.reduce((a, r) => a + (r.duration_minutes || 0), 0);
const sumRevenue = (rows: TimeEntryRow[]) => rows.reduce((a, r) => a + calculateRevenue(r), 0);

export function DashboardScreen() {
  const entriesQ = useQuery({ queryKey: ["time_entries"], queryFn: () => timeEntriesRepo.list() });
  const projectsQ = useQuery({ queryKey: ["projects"], queryFn: () => projectsRepo.list() });

  const entries = entriesQ.data ?? emptyArray<TimeEntryRow>();
  const projects = projectsQ.data ?? emptyArray<ProjectRow>();

  const { now, todayISO, weekStart, monthStart } = useDateBoundaries();

  const { todayEntries, weekEntries, monthEntries, billable, nonBillable } = useMemo(
    () => ({
      todayEntries: entries.filter((e) => e.date === todayISO),
      weekEntries: entries.filter((e) => new Date(e.date) >= weekStart),
      monthEntries: entries.filter((e) => new Date(e.date) >= monthStart),
      billable: entries.filter((e) => e.billable),
      nonBillable: entries.filter((e) => !e.billable),
    }),
    [entries, todayISO, weekStart, monthStart],
  );

  // Last 7 days chart
  const chartData = useMemo(() => {
    const days: { day: string; horas: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const mins = sumMinutes(entries.filter((e) => e.date === iso));
      days.push({
        day: d.toLocaleDateString(undefined, { weekday: "short" }),
        horas: +(mins / 60).toFixed(1),
      });
    }
    return days;
  }, [entries, now]);

  const activeProjects = useMemo(
    () =>
      projects
        .filter((p) => p.status === "active")
        .map((p) => {
          const projMins = sumMinutes(entries.filter((e) => e.project_id === p.id));
          const pct = p.estimated_hours
            ? Math.min(100, (projMins / 60 / p.estimated_hours) * 100)
            : 0;
          return { ...p, projMins, pct };
        }),
    [projects, entries],
  );

  const recentEntries = useMemo(
    () => [...entries].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 8),
    [entries],
  );

  if (entriesQ.isLoading || projectsQ.isLoading) {
    return (
      <>
        <PageHeader title="Dashboard" description="Panorama do seu tempo, projetos e receita." />
        <PageBody>
          <LoadingState />
        </PageBody>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Dashboard" description="Panorama do seu tempo, projetos e receita." />
      <PageBody>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Hoje"
            value={formatHours(sumMinutes(todayEntries))}
            hint={`${todayEntries.length} registros`}
            accent="primary"
          />
          <StatCard
            label="Esta semana"
            value={formatHours(sumMinutes(weekEntries))}
            hint={`${weekEntries.length} registros`}
            accent="secondary"
          />
          <StatCard
            label="Este mês"
            value={formatHours(sumMinutes(monthEntries))}
            hint={`${monthEntries.length} registros`}
          />
          <StatCard
            label="Receita (mês)"
            value={formatCurrency(sumRevenue(monthEntries))}
            hint="Somente faturável"
            accent="primary"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="card-surface xl:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">Produtividade — últimos 7 dias</h3>
              <span className="text-xs text-[var(--text-muted)]">horas</span>
            </div>
            <div className="h-[260px] w-full">
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--surface-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                    }}
                    labelStyle={{ color: "var(--text-primary)" }}
                  />
                  <Bar dataKey="horas" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-4">
            <StatCard
              label="Faturáveis"
              value={formatHours(sumMinutes(billable))}
              accent="primary"
            />
            <StatCard
              label="Não faturáveis"
              value={formatHours(sumMinutes(nonBillable))}
              accent="muted"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="card-surface">
            <h3 className="mb-4 text-base font-semibold">Projetos ativos</h3>
            <div className="space-y-2">
              {activeProjects.length === 0 && (
                <p className="text-sm text-[var(--text-muted)]">Nenhum projeto ativo.</p>
              )}
              {activeProjects.map((p) => (
                <div key={p.id} className="rounded-xl border border-[var(--border)] p-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: p.color || "var(--primary)" }}
                      />
                      <span className="font-medium">{p.name}</span>
                    </div>
                    <span className="text-[var(--text-muted)]">{formatHours(p.projMins)}</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-[var(--surface-hover)]">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${p.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-surface">
            <h3 className="mb-4 text-base font-semibold">Últimos registros</h3>
            <div className="space-y-1.5">
              {recentEntries.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-[var(--surface-hover)]"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{e.project_name || "—"}</div>
                    <div className="truncate text-xs text-[var(--text-muted)]">
                      {e.client_name} · {e.task_name} · {e.member_name}
                    </div>
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {formatHours(e.duration_minutes)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageBody>
    </>
  );
}
