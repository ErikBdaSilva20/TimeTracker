import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Play, Square } from "lucide-react";
import { toast } from "sonner";
import { PageBody, PageHeader, EmptyState, Badge } from "@/components/layout/PageHeader";
import { clientsRepo, projectsRepo, tasksRepo, timeEntriesRepo, membersRepo, type TimeEntryRow } from "@/lib/data";
import { formatHours } from "@/lib/format";

export function TimeEntriesScreen() {
  const qc = useQueryClient();
  const clientsQ = useQuery({ queryKey: ["clients"], queryFn: () => clientsRepo.list() });
  const projectsQ = useQuery({ queryKey: ["projects"], queryFn: () => projectsRepo.list() });
  const tasksQ = useQuery({ queryKey: ["tasks"], queryFn: () => tasksRepo.list() });
  const membersQ = useQuery({ queryKey: ["members"], queryFn: () => membersRepo.list() });
  const entriesQ = useQuery({ queryKey: ["time_entries"], queryFn: () => timeEntriesRepo.list() });

  const [filter, setFilter] = useState<{ project?: string; client?: string }>({});
  const [showForm, setShowForm] = useState(false);

  const projectsMap = useMemo(() => new Map((projectsQ.data ?? []).map((p) => [p.id, p])), [projectsQ.data]);
  const clientsMap = useMemo(() => new Map((clientsQ.data ?? []).map((c) => [c.id, c])), [clientsQ.data]);
  const tasksMap = useMemo(() => new Map((tasksQ.data ?? []).map((t) => [t.id, t])), [tasksQ.data]);
  const membersMap = useMemo(() => new Map((membersQ.data ?? []).map((m) => [m.id, m])), [membersQ.data]);

  const entries = (entriesQ.data ?? [])
    .filter((e) => !filter.project || e.project_id === filter.project)
    .filter((e) => !filter.client || e.client_id === filter.client)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const total = entries.reduce((a, e) => a + e.duration_minutes, 0);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const project_id = String(fd.get("project_id") || "");
    const task_id = String(fd.get("task_id") || "");
    const member_id = String(fd.get("member_id") || "");
    const project = projectsMap.get(project_id);
    const client = project?.client_id ? clientsMap.get(project.client_id) : null;
    const task = tasksMap.get(task_id);
    const member = membersMap.get(member_id);

    const payload: Partial<TimeEntryRow> = {
      client_id: client?.id ?? null,
      project_id,
      task_id: task_id || null,
      member_id: member_id || null,
      date: String(fd.get("date") || new Date().toISOString().slice(0, 10)),
      duration_minutes: Number(fd.get("duration_minutes") || 0),
      billable: fd.get("billable") === "on",
      notes: String(fd.get("notes") || "") || null,
      client_name: client?.name ?? null,
      project_name: project?.name ?? null,
      task_name: task?.name ?? null,
      member_name: member?.name ?? null,
      hour_rate: project?.hourly_rate ?? null,
      currency: "BRL",
    };
    try {
      await timeEntriesRepo.create(payload);
      toast.success("Registro criado");
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["time_entries"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  };

  return (
    <>
      <PageHeader
        title="Time Entries"
        description="Todos os registros de tempo — a fonte da verdade do trabalho realizado."
        actions={
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-[var(--primary-hover)]">
            <Plus className="h-4 w-4" /> Novo registro
          </button>
        }
      />
      <PageBody>
        <div className="flex flex-wrap items-center gap-3">
          <select value={filter.client ?? ""} onChange={(e) => setFilter((f) => ({ ...f, client: e.target.value || undefined }))} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm">
            <option value="">Todos os clientes</option>
            {(clientsQ.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filter.project ?? ""} onChange={(e) => setFilter((f) => ({ ...f, project: e.target.value || undefined }))} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm">
            <option value="">Todos os projetos</option>
            {(projectsQ.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="ml-auto text-sm text-[var(--text-muted)]">
            {entries.length} registros · <span className="text-[var(--text-primary)] font-medium">{formatHours(total)}</span>
          </div>
        </div>

        {showForm && (
          <form onSubmit={onSubmit} className="card-surface space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Projeto *</label>
                <select name="project_id" required className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm">
                  <option value="">Selecione…</option>
                  {(projectsQ.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Task</label>
                <select name="task_id" className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm">
                  <option value="">—</option>
                  {(tasksQ.data ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Responsável</label>
                <select name="member_id" className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm">
                  <option value="">—</option>
                  {(membersQ.data ?? []).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Data</label>
                <input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Minutos</label>
                <input name="duration_minutes" type="number" defaultValue="60" required className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm" />
              </div>
              <label className="flex items-center gap-2 self-end text-sm">
                <input name="billable" type="checkbox" defaultChecked /> Faturável
              </label>
              <div className="md:col-span-3">
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Notas</label>
                <textarea name="notes" rows={2} className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm">Cancelar</button>
              <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-[var(--primary-hover)]">Salvar</button>
            </div>
          </form>
        )}

        {entriesQ.isLoading ? (
          <div className="card-surface">Carregando…</div>
        ) : entries.length === 0 ? (
          <EmptyState title="Sem registros" description="Registre horas via Timer ou manualmente." action={<button onClick={() => setShowForm(true)} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Plus className="mr-1 inline h-4 w-4" />Novo registro</button>} />
        ) : (
          <div className="card-surface overflow-hidden !p-0">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-[var(--background-tertiary)] text-[var(--text-muted)]">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Data</th>
                  <th className="px-5 py-3 text-left font-medium">Cliente / Projeto</th>
                  <th className="px-5 py-3 text-left font-medium">Task</th>
                  <th className="px-5 py-3 text-left font-medium">Responsável</th>
                  <th className="px-5 py-3 text-left font-medium">Duração</th>
                  <th className="px-5 py-3 text-left font-medium">Faturável</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-hover)]">
                    <td className="px-5 py-3 text-[var(--text-secondary)]">{e.date}</td>
                    <td className="px-5 py-3">
                      <div className="font-medium">{e.project_name}</div>
                      <div className="text-xs text-[var(--text-muted)]">{e.client_name}</div>
                    </td>
                    <td className="px-5 py-3 text-[var(--text-secondary)]">{e.task_name || "—"}</td>
                    <td className="px-5 py-3 text-[var(--text-secondary)]">{e.member_name || "—"}</td>
                    <td className="px-5 py-3 font-medium">{formatHours(e.duration_minutes)}</td>
                    <td className="px-5 py-3">{e.billable ? <Badge tone="primary">sim</Badge> : <Badge>não</Badge>}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={async () => { if (confirm("Excluir?")) { await timeEntriesRepo.remove(e.id); qc.invalidateQueries({ queryKey: ["time_entries"] }); } }} className="text-xs text-red-400 hover:underline">Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </PageBody>
    </>
  );
}

// exported to reuse in TimerScreen indirectly if needed
export { Play, Square };
