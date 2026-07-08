import type { BadgeTone } from "@/components/layout/PageHeader";
import type { ClientStatus, InvoiceStatus, ProjectStatus, TaskStatus } from "./data";

/**
 * Status → label/tone dictionaries for the entities that show a status
 * Badge (clients, projects, tasks, invoices). Centralized because this was
 * previously re-decided ad hoc in each screen — some as a `Record` lookup,
 * some as nested ternaries — and every one of them displayed the raw
 * English enum value instead of a label, inconsistent with the rest of the
 * app being pt-BR. Add a new status here once; every screen picks it up.
 */

interface StatusMeta {
  label: string;
  tone: BadgeTone;
}

export const CLIENT_STATUS: Record<ClientStatus, StatusMeta> = {
  active: { label: "Ativo", tone: "primary" },
  inactive: { label: "Inativo", tone: "muted" },
  archived: { label: "Arquivado", tone: "muted" },
};

export const PROJECT_STATUS: Record<ProjectStatus, StatusMeta> = {
  active: { label: "Ativo", tone: "primary" },
  paused: { label: "Pausado", tone: "secondary" },
  completed: { label: "Concluído", tone: "muted" },
  archived: { label: "Arquivado", tone: "muted" },
};

export const TASK_STATUS: Record<TaskStatus, StatusMeta> = {
  todo: { label: "A fazer", tone: "muted" },
  in_progress: { label: "Em andamento", tone: "muted" },
  review: { label: "Em revisão", tone: "muted" },
  done: { label: "Concluída", tone: "primary" },
};

export const INVOICE_STATUS: Record<InvoiceStatus, StatusMeta> = {
  draft: { label: "Rascunho", tone: "muted" },
  sent: { label: "Enviada", tone: "secondary" },
  paid: { label: "Paga", tone: "primary" },
  overdue: { label: "Atrasada", tone: "danger" },
  cancelled: { label: "Cancelada", tone: "muted" },
};
