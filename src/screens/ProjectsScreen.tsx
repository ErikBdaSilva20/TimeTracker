import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import {
  PageBody,
  PageHeader,
  EmptyState,
  LoadingState,
  Badge,
  FormField,
} from "@/components/layout/PageHeader";
import { projectsRepo, clientsRepo, timeEntriesRepo, type ProjectRow } from "@/lib/data";
import { formatCurrency, formatHours } from "@/lib/format";
import { PROJECT_STATUS } from "@/lib/domain";
import { useConfirm } from "@/hooks/useConfirm";
import { runMutation } from "@/lib/mutations";

export function ProjectsScreen() {
  const qc = useQueryClient();
  const clientsQ = useQuery({ queryKey: ["clients"], queryFn: () => clientsRepo.list() });
  const projectsQ = useQuery({ queryKey: ["projects"], queryFn: () => projectsRepo.list() });
  const entriesQ = useQuery({ queryKey: ["time_entries"], queryFn: () => timeEntriesRepo.list() });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ProjectRow | null>(null);
  const { confirm, dialog } = useConfirm();

  const clientsMap = useMemo(
    () => new Map((clientsQ.data ?? []).map((c) => [c.id, c])),
    [clientsQ.data],
  );
  const minutesByProject = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of entriesQ.data ?? []) {
      if (e.project_id) m.set(e.project_id, (m.get(e.project_id) ?? 0) + e.duration_minutes);
    }
    return m;
  }, [entriesQ.data]);

  const projects = projectsQ.data ?? [];

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload: Partial<ProjectRow> = {
      client_id: String(fd.get("client_id") || "") || null,
      name: String(fd.get("name") || ""),
      description: String(fd.get("description") || "") || null,
      color: String(fd.get("color") || "#22c55e"),
      status: (fd.get("status") as ProjectRow["status"]) || "active",
      estimated_hours: Number(fd.get("estimated_hours")) || null,
      hourly_rate: Number(fd.get("hourly_rate")) || null,
      budget: Number(fd.get("budget")) || null,
    };
    await runMutation(
      () => (editing ? projectsRepo.update(editing.id, payload) : projectsRepo.create(payload)),
      {
        successMessage: editing ? "Projeto atualizado" : "Projeto criado",
        onSuccess: () => {
          setShowForm(false);
          setEditing(null);
          qc.invalidateQueries({ queryKey: ["projects"] });
        },
      },
    );
  };

  return (
    <>
      {dialog}
      <PageHeader
        title="Projetos"
        description="Orçamento, horas estimadas e progresso real por projeto."
        actions={
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-[var(--primary-hover)]"
          >
            <Plus className="h-4 w-4" /> Novo projeto
          </button>
        }
      />
      <PageBody>
        {showForm && (
          <form onSubmit={onSubmit} className="card-surface space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  Cliente *
                </label>
                <select
                  name="client_id"
                  required
                  defaultValue={editing?.client_id ?? ""}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                >
                  <option value="">Selecione…</option>
                  {(clientsQ.data ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <FormField name="name" label="Nome" required defaultValue={editing?.name} />
              <FormField
                name="estimated_hours"
                label="Horas estimadas"
                type="number"
                defaultValue={editing?.estimated_hours ?? ""}
              />
              <FormField
                name="hourly_rate"
                label="Valor/hora"
                type="number"
                defaultValue={editing?.hourly_rate ?? ""}
              />
              <FormField
                name="budget"
                label="Orçamento"
                type="number"
                defaultValue={editing?.budget ?? ""}
              />
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  Status
                </label>
                <select
                  name="status"
                  defaultValue={editing?.status ?? "active"}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                >
                  <option value="active">Ativo</option>
                  <option value="paused">Pausado</option>
                  <option value="completed">Concluído</option>
                  <option value="archived">Arquivado</option>
                </select>
              </div>
              <FormField
                name="color"
                label="Cor"
                type="color"
                defaultValue={editing?.color ?? "#22c55e"}
              />
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  Descrição
                </label>
                <textarea
                  name="description"
                  defaultValue={editing?.description ?? ""}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                  rows={3}
                />
              </div>
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
        )}

        {projectsQ.isLoading ? (
          <LoadingState />
        ) : projects.length === 0 ? (
          <EmptyState
            title="Nenhum projeto ainda"
            description="Crie um projeto e comece a registrar tempo."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((p) => {
              const mins = minutesByProject.get(p.id) ?? 0;
              const pct = p.estimated_hours
                ? Math.min(100, (mins / 60 / p.estimated_hours) * 100)
                : 0;
              const c = p.client_id ? clientsMap.get(p.client_id) : null;
              const revenue = (mins / 60) * (p.hourly_rate ?? 0);
              return (
                <div key={p.id} className="card-surface card-surface-hover">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ background: p.color || "var(--primary)" }}
                      />
                      <div>
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-xs text-[var(--text-muted)]">{c?.name ?? "—"}</div>
                      </div>
                    </div>
                    <Badge tone={PROJECT_STATUS[p.status].tone}>
                      {PROJECT_STATUS[p.status].label}
                    </Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-[var(--text-muted)]">Realizado</div>
                      <div className="mt-0.5 font-medium">{formatHours(mins)}</div>
                    </div>
                    <div>
                      <div className="text-[var(--text-muted)]">Estimado</div>
                      <div className="mt-0.5 font-medium">
                        {p.estimated_hours ? `${p.estimated_hours}h` : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[var(--text-muted)]">Receita</div>
                      <div className="mt-0.5 font-medium">{formatCurrency(revenue)}</div>
                    </div>
                  </div>
                  <div className="mt-4 h-1.5 rounded-full bg-[var(--surface-hover)]">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-4 flex justify-end gap-2 text-xs">
                    <button
                      onClick={() => {
                        setEditing(p);
                        setShowForm(true);
                      }}
                      className="text-[var(--secondary)] hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={async () => {
                        if (!(await confirm("Excluir projeto?"))) return;
                        await runMutation(() => projectsRepo.remove(p.id), {
                          successMessage: "Excluído",
                          onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
                        });
                      }}
                      className="text-red-400 hover:underline"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PageBody>
    </>
  );
}
