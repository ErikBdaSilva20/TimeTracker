import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { Play, Pause, Square } from "lucide-react";
import { toast } from "sonner";
import { PageBody, PageHeader } from "@/components/layout/PageHeader";
import {
  clientsRepo,
  projectsRepo,
  tasksRepo,
  timeEntriesRepo,
  type TimeEntryRow,
} from "@/lib/data";
import { formatDuration } from "@/lib/format";
import { useTimerSession } from "@/hooks/use-timer-session";

export function TimerScreen() {
  const qc = useQueryClient();
  const projectsQ = useQuery({ queryKey: ["projects"], queryFn: () => projectsRepo.list() });
  const tasksQ = useQuery({ queryKey: ["tasks"], queryFn: () => tasksRepo.list() });
  const clientsQ = useQuery({ queryKey: ["clients"], queryFn: () => clientsRepo.list() });

  const {
    projectId,
    setProjectId,
    taskId,
    setTaskId,
    notes,
    setNotes,
    seconds,
    running,
    restoring,
    recovered,
    start: startSession,
    pause: pauseSession,
    finalize,
  } = useTimerSession();

  const recoveredToastShown = useRef(false);
  useEffect(() => {
    if (recovered && !recoveredToastShown.current) {
      recoveredToastShown.current = true;
      toast.info("Cronômetro em andamento recuperado");
    }
  }, [recovered]);

  const start = async () => {
    if (!projectId) {
      toast.error("Selecione um projeto");
      return;
    }
    await startSession();
  };
  const pause = () => {
    void pauseSession();
  };
  const stop = async () => {
    const finalSeconds = await finalize();
    if (finalSeconds < 1) return;
    const project = (projectsQ.data ?? []).find((p) => p.id === projectId);
    const client = project?.client_id
      ? (clientsQ.data ?? []).find((c) => c.id === project.client_id)
      : null;
    const task = (tasksQ.data ?? []).find((t) => t.id === taskId);
    const payload: Partial<TimeEntryRow> = {
      project_id: projectId,
      client_id: client?.id ?? null,
      task_id: taskId || null,
      date: new Date().toISOString().slice(0, 10),
      duration_minutes: Math.max(1, Math.round(finalSeconds / 60)),
      billable: true,
      notes: notes || null,
      client_name: client?.name ?? null,
      project_name: project?.name ?? null,
      task_name: task?.name ?? null,
      hour_rate: project?.hourly_rate ?? null,
      currency: "BRL",
    };
    await timeEntriesRepo.create(payload);
    qc.invalidateQueries({ queryKey: ["time_entries"] });
    toast.success("Registro salvo");
  };

  return (
    <>
      <PageHeader
        title="Timer"
        description="Comece um cronômetro e gere um registro automático ao parar."
      />
      <PageBody>
        <div className="card-surface mx-auto max-w-2xl text-center">
          <div className="text-5xl font-semibold tabular-nums tracking-tight sm:text-[64px]">
            {formatDuration(seconds)}
          </div>
          <div className="mt-2 text-xs uppercase tracking-widest text-[var(--text-muted)]">
            {restoring ? "verificando sessão em aberto…" : running ? "gravando" : "parado"}
          </div>

          <div className="mt-8 grid gap-3 text-left md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Projeto
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
              >
                <option value="">Selecione…</option>
                {(projectsQ.data ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Task
              </label>
              <select
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
              >
                <option value="">—</option>
                {(tasksQ.data ?? [])
                  .filter((t) => !projectId || t.project_id === projectId)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Descrição
              </label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="No que você está trabalhando?"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-3">
            {!running ? (
              <button
                onClick={start}
                disabled={restoring}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground hover:bg-[var(--primary-hover)] disabled:opacity-50"
              >
                <Play className="h-4 w-4" /> {seconds > 0 ? "Continuar" : "Iniciar"}
              </button>
            ) : (
              <button
                onClick={pause}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-5 py-3 font-semibold hover:bg-[var(--surface-hover)]"
              >
                <Pause className="h-4 w-4" /> Pausar
              </button>
            )}
            <button
              onClick={stop}
              disabled={restoring || seconds === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-5 py-3 font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] disabled:opacity-50"
            >
              <Square className="h-4 w-4" /> Parar & salvar
            </button>
          </div>
        </div>
      </PageBody>
    </>
  );
}
