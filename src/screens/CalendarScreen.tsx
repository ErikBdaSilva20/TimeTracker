import { Badge, PageBody, PageHeader } from "@/components/layout/PageHeader";
import { timeEntriesRepo, type TimeEntryRow } from "@/lib/data";
import { emptyArray } from "@/lib/empty";
import { formatHours } from "@/lib/format";
import { useQuery } from "@tanstack/react-query";
import { startOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function CalendarScreen() {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<string>(isoDate(new Date()));
  const entriesQ = useQuery({ queryKey: ["time_entries"], queryFn: () => timeEntriesRepo.list() });
  const entries = entriesQ.data ?? emptyArray<TimeEntryRow>();

  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const cells = useMemo(() => {
    const first = startOfMonth(cursor);
    const firstWeekday = (first.getDay() + 6) % 7; // Mon-based
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const arr: { date: Date | null; iso: string | null }[] = [];
    for (let i = 0; i < firstWeekday; i++) arr.push({ date: null, iso: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(cursor.getFullYear(), cursor.getMonth(), d);
      arr.push({ date: dt, iso: isoDate(dt) });
    }
    while (arr.length % 7 !== 0) arr.push({ date: null, iso: null });
    return arr;
  }, [cursor]);

  const byDay = useMemo(() => {
    const m = new Map<string, { minutes: number; count: number }>();
    entries.forEach((e) => {
      const v = m.get(e.date) ?? { minutes: 0, count: 0 };
      v.minutes += e.duration_minutes || 0;
      v.count += 1;
      m.set(e.date, v);
    });
    return m;
  }, [entries]);

  const maxMinutes = Math.max(1, ...Array.from(byDay.values()).map((v) => v.minutes));
  const dayEntries = entries.filter((e) => e.date === selected);
  const todayIso = isoDate(new Date());

  return (
    <>
      <PageHeader
        title="Calendário"
        description="Visão mensal dos registros de tempo."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCursor(addMonths(cursor, -1))}
              className="rounded-lg border border-[var(--border)] p-2 hover:bg-[var(--surface-hover)]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="min-w-[160px] text-center text-sm font-medium capitalize">
              {monthLabel}
            </div>
            <button
              onClick={() => setCursor(addMonths(cursor, 1))}
              className="rounded-lg border border-[var(--border)] p-2 hover:bg-[var(--surface-hover)]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                const now = new Date();
                setCursor(startOfMonth(now));
                setSelected(isoDate(now));
              }}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs"
            >
              Hoje
            </button>
          </div>
        }
      />
      <PageBody>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="card-surface xl:col-span-2">
            <div className="mb-2 grid grid-cols-7 text-center text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              {WEEKDAYS.map((w) => (
                <div key={w} className="py-2">
                  {w}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((c, i) => {
                if (!c.date || !c.iso) return <div key={i} className="h-16 sm:h-24" />;
                const info = byDay.get(c.iso);
                const intensity = info ? Math.max(0.15, info.minutes / maxMinutes) : 0;
                const isSelected = c.iso === selected;
                const isToday = c.iso === todayIso;
                return (
                  <button
                    key={c.iso}
                    onClick={() => setSelected(c.iso!)}
                    className={`relative flex h-16 flex-col items-start justify-between rounded-xl border p-1.5 text-left text-xs transition sm:h-24 sm:p-2 ${
                      isSelected
                        ? "border-primary bg-[var(--primary-soft)]"
                        : "border-[var(--border)] hover:bg-[var(--surface-hover)]"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span
                        className={`font-semibold ${isToday ? "text-primary" : "text-[var(--text-primary)]"}`}
                      >
                        {c.date.getDate()}
                      </span>
                      {info && (
                        <span className="text-[10px] text-[var(--text-muted)]">{info.count}</span>
                      )}
                    </div>
                    {info && (
                      <>
                        <div
                          className="h-1.5 w-full rounded-full"
                          style={{
                            background: `color-mix(in oklab, var(--primary) ${Math.round(
                              intensity * 100,
                            )}%, transparent)`,
                          }}
                        />
                        <div className="text-[10px] font-medium text-[var(--text-secondary)]">
                          {formatHours(info.minutes)}
                        </div>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card-surface">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">
                {new Date(selected).toLocaleDateString(undefined, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </h3>
              <Badge tone="primary">
                {formatHours(dayEntries.reduce((a, e) => a + e.duration_minutes, 0))}
              </Badge>
            </div>
            {dayEntries.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">Sem registros nesse dia.</p>
            ) : (
              <div className="space-y-2">
                {dayEntries.map((e) => (
                  <div key={e.id} className="rounded-xl border border-[var(--border)] p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{e.project_name || "—"}</div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {formatHours(e.duration_minutes)}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-[var(--text-muted)]">
                      {e.client_name} · {e.task_name} · {e.member_name}
                    </div>
                    {e.notes && (
                      <div className="mt-2 text-xs text-[var(--text-secondary)]">{e.notes}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PageBody>
    </>
  );
}
