import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  PageBody,
  PageHeader,
  EmptyState,
  Badge,
  ResponsiveTable,
} from "@/components/layout/PageHeader";
import { tasksRepo, projectsRepo, membersRepo, type TaskRow } from "@/lib/data";
import { TASK_STATUS } from "@/lib/domain";
import { useConfirm } from "@/hooks/useConfirm";

export function TasksScreen() {
  const qc = useQueryClient();
  const tasksQ = useQuery({ queryKey: ["tasks"], queryFn: () => tasksRepo.list() });
  const projectsQ = useQuery({ queryKey: ["projects"], queryFn: () => projectsRepo.list() });
  const membersQ = useQuery({ queryKey: ["members"], queryFn: () => membersRepo.list() });
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<string>("");
  const { confirm, dialog } = useConfirm();

  const projectsMap = useMemo(() => new Map((projectsQ.data ?? []).map((p) => [p.id, p])), [projectsQ.data]);
  const membersMap = useMemo(() => new Map((membersQ.data ?? []).map((m) => [m.id, m])), [membersQ.data]);
  const tasks = (tasksQ.data ?? []).filter((t) => !filter || t.project_id === filter);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload: Partial<TaskRow> = {
      project_id: String(fd.get("project_id") || "") || null,
      name: String(fd.get("name") || ""),
      priority: (fd.get("priority") as TaskRow["priority"]) || "medium",
      status: (fd.get("status") as TaskRow["status"]) || "todo",
      estimated_hours: Number(fd.get("estimated_hours")) || null,
      member_id: String(fd.get("member_id") || "") || null,
    };
    await tasksRepo.create(payload);
    toast.success("Task criada");
    setShowForm(false);
    qc.invalidateQueries({ queryKey: ["tasks"] });
  };

  return (
    <>
      {dialog}
      <PageHeader
        title="Tasks"
        description="Divida projetos em tarefas rastreáveis."
        actions={
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-[var(--primary-hover)]">
            <Plus className="h-4 w-4" /> Nova task
          </button>
        }
      />
      <PageBody>
        <div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm">
            <option value="">Todos os projetos</option>
            {(projectsQ.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {showForm && (
          <form onSubmit={onSubmit} className="card-surface space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Projeto *</label>
                <select name="project_id" required className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm">
                  <option value="">Selecione…</option>
                  {(projectsQ.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Nome *</label>
                <input name="name" required className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Prioridade</label>
                <select name="priority" className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm">
                  <option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option><option value="urgent">Urgente</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Status</label>
                <select name="status" className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm">
                  <option value="todo">A fazer</option><option value="in_progress">Em progresso</option><option value="review">Revisão</option><option value="done">Concluída</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Horas estimadas</label>
                <input name="estimated_hours" type="number" className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Responsável</label>
                <select name="member_id" className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm">
                  <option value="">—</option>
                  {(membersQ.data ?? []).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm">Cancelar</button>
              <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-[var(--primary-hover)]">Salvar</button>
            </div>
          </form>
        )}

        {tasksQ.isLoading ? (
          <div className="card-surface">Carregando…</div>
        ) : tasks.length === 0 ? (
          <EmptyState title="Sem tasks" description="Adicione tasks para dividir e acompanhar o trabalho." />
        ) : (
          <ResponsiveTable>
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-[var(--background-tertiary)] text-[var(--text-muted)]">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Task</th>
                  <th className="px-5 py-3 text-left font-medium">Projeto</th>
                  <th className="px-5 py-3 text-left font-medium">Responsável</th>
                  <th className="px-5 py-3 text-left font-medium">Prioridade</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-hover)]">
                    <td className="px-5 py-3 font-medium">{t.name}</td>
                    <td className="px-5 py-3 text-[var(--text-secondary)]">{t.project_id ? projectsMap.get(t.project_id)?.name : "—"}</td>
                    <td className="px-5 py-3 text-[var(--text-secondary)]">{t.member_id ? membersMap.get(t.member_id)?.name : "—"}</td>
                    <td className="px-5 py-3"><Badge tone={t.priority === "urgent" ? "danger" : t.priority === "high" ? "secondary" : "muted"}>{t.priority}</Badge></td>
                    <td className="px-5 py-3">
                      {t.status ? (
                        <Badge tone={TASK_STATUS[t.status].tone}>{TASK_STATUS[t.status].label}</Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={async () => { if (await confirm("Excluir?")) { await tasksRepo.remove(t.id); qc.invalidateQueries({ queryKey: ["tasks"] }); } }} className="text-xs text-red-400 hover:underline">Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ResponsiveTable>
        )}
      </PageBody>
    </>
  );
}
