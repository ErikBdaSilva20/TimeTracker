import { PageBody, PageHeader, StatCard } from "@/components/layout/PageHeader";
import { useDateBoundaries } from "@/hooks/use-date-boundaries";
import { calculateRevenue } from "@/lib/billing";
import {
  clientsRepo,
  membersRepo,
  projectsRepo,
  timeEntriesRepo,
  type TimeEntryRow,
} from "@/lib/data";
import { emptyArray } from "@/lib/empty";
import { formatCurrency, formatHours } from "@/lib/format";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PIE_COLORS = [
  "var(--primary)",
  "var(--secondary)",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#10b981",
  "#06b6d4",
];

export function AnalyticsScreen() {
  const entriesQ = useQuery({ queryKey: ["time_entries"], queryFn: () => timeEntriesRepo.list() });
  const projectsQ = useQuery({ queryKey: ["projects"], queryFn: () => projectsRepo.list() });
  const clientsQ = useQuery({ queryKey: ["clients"], queryFn: () => clientsRepo.list() });
  const membersQ = useQuery({ queryKey: ["members"], queryFn: () => membersRepo.list() });

  const entries = entriesQ.data ?? emptyArray<TimeEntryRow>();

  const { now: today, monthStart, prevMonthStart, prevMonthEnd } = useDateBoundaries();

  const kpis = useMemo(() => {
    const currMonth = entries.filter((e) => new Date(e.date) >= monthStart);
    const prevMonth = entries.filter(
      (e) => new Date(e.date) >= prevMonthStart && new Date(e.date) <= prevMonthEnd,
    );
    const sumMin = (rows: typeof entries) => rows.reduce((a, e) => a + e.duration_minutes, 0);
    const sumRev = (rows: typeof entries) => rows.reduce((a, e) => a + calculateRevenue(e), 0);
    const curr = sumMin(currMonth);
    const prev = sumMin(prevMonth);
    const currRev = sumRev(currMonth);
    const prevRev = sumRev(prevMonth);
    const billableMin = currMonth
      .filter((e) => e.billable)
      .reduce((a, e) => a + e.duration_minutes, 0);
    return {
      currHours: curr,
      prevHours: prev,
      hoursDelta: prev ? ((curr - prev) / prev) * 100 : 0,
      currRev,
      revDelta: prevRev ? ((currRev - prevRev) / prevRev) * 100 : 0,
      billablePct: curr ? (billableMin / curr) * 100 : 0,
      effectiveRate: billableMin ? currRev / (billableMin / 60) : 0,
    };
  }, [entries, monthStart, prevMonthStart, prevMonthEnd]);

  // Last 12 weeks trend
  const trend = useMemo(() => {
    const buckets: { label: string; hours: number; revenue: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const end = new Date(today);
      end.setDate(today.getDate() - i * 7);
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      const inRange = entries.filter((e) => {
        const d = new Date(e.date);
        return d >= start && d <= end;
      });
      const mins = inRange.reduce((a, e) => a + e.duration_minutes, 0);
      const rev = inRange.reduce((a, e) => a + calculateRevenue(e), 0);
      buckets.push({
        label: `${start.getDate()}/${start.getMonth() + 1}`,
        hours: +(mins / 60).toFixed(1),
        revenue: +rev.toFixed(0),
      });
    }
    return buckets;
  }, [entries, today]);

  const byClient = useMemo(() => {
    const map = new Map<string, { name: string; value: number }>();
    for (const e of entries) {
      const key = e.client_id || "—";
      const name = e.client_name || "Sem cliente";
      const cur = map.get(key) ?? { name, value: 0 };
      cur.value += e.duration_minutes;
      map.set(key, cur);
    }
    return Array.from(map.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 7)
      .map((r) => ({ ...r, value: +(r.value / 60).toFixed(1) }));
  }, [entries]);

  const byMember = useMemo(() => {
    const map = new Map<string, { name: string; hours: number; revenue: number }>();
    for (const e of entries) {
      const key = e.member_id || "—";
      const name = e.member_name || "Sem membro";
      const cur = map.get(key) ?? { name, hours: 0, revenue: 0 };
      cur.hours += e.duration_minutes;
      cur.revenue += calculateRevenue(e);
      map.set(key, cur);
    }
    return Array.from(map.values())
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 8)
      .map((r) => ({
        name: r.name,
        hours: +(r.hours / 60).toFixed(1),
        revenue: +r.revenue.toFixed(0),
      }));
  }, [entries]);

  const tooltipStyle = {
    background: "var(--surface-elevated)",
    border: "1px solid var(--border)",
    borderRadius: 12,
  };

  return (
    <>
      <PageHeader
        title="Analytics"
        description="KPIs agregados calculados sobre os time entries."
      />
      <PageBody>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Horas este mês"
            value={formatHours(kpis.currHours)}
            hint={`${kpis.hoursDelta >= 0 ? "+" : ""}${kpis.hoursDelta.toFixed(1)}% vs mês anterior`}
            accent="primary"
          />
          <StatCard
            label="Receita este mês"
            value={formatCurrency(kpis.currRev)}
            hint={`${kpis.revDelta >= 0 ? "+" : ""}${kpis.revDelta.toFixed(1)}% vs mês anterior`}
            accent="secondary"
          />
          <StatCard
            label="% faturável"
            value={`${kpis.billablePct.toFixed(0)}%`}
            hint="Sobre o total do mês"
          />
          <StatCard
            label="Valor-hora efetivo"
            value={formatCurrency(kpis.effectiveRate)}
            hint="Receita / horas faturáveis"
            accent="primary"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="card-surface xl:col-span-2">
            <h3 className="mb-4 text-base font-semibold">Tendência — últimas 12 semanas</h3>
            <div className="h-[280px]">
              <ResponsiveContainer>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="hours"
                    stroke="var(--primary)"
                    strokeWidth={2.5}
                    dot={false}
                    name="Horas"
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--secondary)"
                    strokeWidth={2.5}
                    dot={false}
                    name="Receita"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card-surface">
            <h3 className="mb-4 text-base font-semibold">Mix por cliente (horas)</h3>
            <div className="h-[280px]">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={byClient}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={2}
                  >
                    {byClient.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1 text-xs">
              {byClient.map((c, i) => (
                <div key={c.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="truncate">{c.name}</span>
                  </div>
                  <span className="text-[var(--text-muted)]">{c.value}h</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card-surface">
          <h3 className="mb-4 text-base font-semibold">Performance por membro</h3>
          <div className="h-[300px]">
            <ResponsiveContainer>
              <BarChart data={byMember}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="hours" fill="var(--primary)" radius={[6, 6, 0, 0]} name="Horas" />
                <Bar
                  dataKey="revenue"
                  fill="var(--secondary)"
                  radius={[6, 6, 0, 0]}
                  name="Receita"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-[var(--text-muted)] md:grid-cols-4">
            <div>{projectsQ.data?.length ?? 0} projetos</div>
            <div>{clientsQ.data?.length ?? 0} clientes</div>
            <div>{membersQ.data?.length ?? 0} membros</div>
            <div>{entries.length} registros totais</div>
          </div>
        </div>
      </PageBody>
    </>
  );
}
