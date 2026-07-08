import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  PageBody,
  PageHeader,
  EmptyState,
  StatCard,
  Badge,
  ResponsiveTable,
} from "@/components/layout/PageHeader";
import { invoicesRepo, clientsRepo, timeEntriesRepo, type InvoiceRow } from "@/lib/data";
import { formatCurrency, formatDate, formatHours } from "@/lib/format";
import { calculateRevenue } from "@/lib/billing";
import { INVOICE_STATUS } from "@/lib/domain";
import { useConfirm } from "@/hooks/useConfirm";

export function InvoicesScreen() {
  const qc = useQueryClient();
  const invoicesQ = useQuery({ queryKey: ["invoices"], queryFn: () => invoicesRepo.list() });
  const clientsQ = useQuery({ queryKey: ["clients"], queryFn: () => clientsRepo.list() });
  const entriesQ = useQuery({ queryKey: ["time_entries"], queryFn: () => timeEntriesRepo.list() });

  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { confirm, dialog } = useConfirm();

  const clientsMap = useMemo(
    () => new Map((clientsQ.data ?? []).map((c) => [c.id, c])),
    [clientsQ.data],
  );

  const invoices = (invoicesQ.data ?? [])
    .filter((i) => statusFilter === "all" || i.status === statusFilter)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  const totals = useMemo(() => {
    const list = invoicesQ.data ?? [];
    return {
      total: list.reduce((a, i) => a + (i.total_amount || 0), 0),
      paid: list.filter((i) => i.status === "paid").reduce((a, i) => a + (i.total_amount || 0), 0),
      outstanding: list
        .filter((i) => i.status === "sent" || i.status === "overdue")
        .reduce((a, i) => a + (i.total_amount || 0), 0),
      count: list.length,
    };
  }, [invoicesQ.data]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const clientId = String(fd.get("client_id") || "");
    const periodStart = String(fd.get("period_start") || "");
    const periodEnd = String(fd.get("period_end") || "");
    const entries = (entriesQ.data ?? []).filter(
      (en) =>
        en.billable &&
        en.client_id === clientId &&
        (!periodStart || en.date >= periodStart) &&
        (!periodEnd || en.date <= periodEnd),
    );
    const totalMinutes = entries.reduce((a, en) => a + (en.duration_minutes || 0), 0);
    const totalAmount = entries.reduce((a, en) => a + calculateRevenue(en), 0);
    const payload: Partial<InvoiceRow> = {
      client_id: clientId || null,
      invoice_number: String(fd.get("invoice_number") || `INV-${Date.now().toString().slice(-6)}`),
      period_start: periodStart || null,
      period_end: periodEnd || null,
      total_hours: +(totalMinutes / 60).toFixed(2),
      total_amount: +totalAmount.toFixed(2),
      status: (fd.get("status") as InvoiceRow["status"]) || "draft",
      issued_at: new Date().toISOString(),
    };
    try {
      await invoicesRepo.create(payload);
      toast.success(`Fatura criada com ${entries.length} entrada(s)`);
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["invoices"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  };

  const changeStatus = async (id: string, status: InvoiceRow["status"]) => {
    await invoicesRepo.update(id, { status });
    qc.invalidateQueries({ queryKey: ["invoices"] });
  };

  const onDelete = async (id: string) => {
    if (!(await confirm("Excluir fatura?"))) return;
    await invoicesRepo.remove(id);
    qc.invalidateQueries({ queryKey: ["invoices"] });
    toast.success("Fatura excluída");
  };

  return (
    <>
      {dialog}
      <PageHeader
        title="Invoices"
        description="Gere faturas a partir de time entries faturáveis."
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-[var(--primary-hover)]"
          >
            <Plus className="h-4 w-4" /> Nova fatura
          </button>
        }
      />
      <PageBody>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard label="Total faturado" value={formatCurrency(totals.total)} accent="primary" />
          <StatCard label="Recebido" value={formatCurrency(totals.paid)} accent="secondary" />
          <StatCard label="Em aberto" value={formatCurrency(totals.outstanding)} />
          <StatCard label="Faturas" value={totals.count} hint="No total" />
        </div>

        <div className="flex items-center gap-2">
          {["all", "draft", "sent", "paid", "overdue", "cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg border px-3 py-1.5 text-xs capitalize ${
                statusFilter === s
                  ? "border-primary bg-[var(--primary-soft)] text-primary"
                  : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              {s === "all" ? "Todos" : INVOICE_STATUS[s as InvoiceRow["status"]].label}
            </button>
          ))}
        </div>

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
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  Nº fatura
                </label>
                <input
                  name="invoice_number"
                  placeholder="Auto"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  Início do período
                </label>
                <input
                  name="period_start"
                  type="date"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  Fim do período
                </label>
                <input
                  name="period_end"
                  type="date"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  Status
                </label>
                <select
                  name="status"
                  defaultValue="draft"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                >
                  {(Object.keys(INVOICE_STATUS) as InvoiceRow["status"][]).map((s) => (
                    <option key={s} value={s}>
                      {INVOICE_STATUS[s].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-[var(--primary-hover)]"
              >
                Gerar fatura
              </button>
            </div>
          </form>
        )}

        {invoicesQ.isLoading ? (
          <div className="card-surface">Carregando…</div>
        ) : invoices.length === 0 ? (
          <EmptyState
            title="Nenhuma fatura"
            description="Gere sua primeira fatura consolidando as entradas de tempo faturáveis de um cliente."
          />
        ) : (
          <ResponsiveTable>
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-[var(--background-tertiary)] text-[var(--text-muted)]">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Fatura</th>
                  <th className="px-5 py-3 text-left font-medium">Cliente</th>
                  <th className="px-5 py-3 text-left font-medium">Período</th>
                  <th className="px-5 py-3 text-left font-medium">Horas</th>
                  <th className="px-5 py-3 text-left font-medium">Valor</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {invoices.map((i) => (
                  <tr
                    key={i.id}
                    className="border-t border-[var(--border)] hover:bg-[var(--surface-hover)]"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 font-medium">
                        <FileText className="h-4 w-4 text-[var(--text-muted)]" />
                        {i.invoice_number}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {formatDate(i.issued_at)}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[var(--text-secondary)]">
                      {i.client_id ? clientsMap.get(i.client_id)?.name || "—" : "—"}
                    </td>
                    <td className="px-5 py-3 text-xs text-[var(--text-secondary)]">
                      {formatDate(i.period_start)} → {formatDate(i.period_end)}
                    </td>
                    <td className="px-5 py-3">{formatHours(Math.round((i.total_hours || 0) * 60))}</td>
                    <td className="px-5 py-3 font-medium">{formatCurrency(i.total_amount || 0)}</td>
                    <td className="px-5 py-3">
                      <select
                        value={i.status}
                        onChange={(e) =>
                          changeStatus(i.id, e.target.value as InvoiceRow["status"])
                        }
                        className="rounded-md border-0 bg-transparent p-0 text-xs"
                      >
                        {(Object.keys(INVOICE_STATUS) as InvoiceRow["status"][]).map((s) => (
                          <option key={s} value={s}>
                            {INVOICE_STATUS[s].label}
                          </option>
                        ))}
                      </select>
                      <div className="mt-1">
                        <Badge tone={INVOICE_STATUS[i.status].tone}>{INVOICE_STATUS[i.status].label}</Badge>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => onDelete(i.id)}
                        className="text-xs text-red-400 hover:underline"
                      >
                        Excluir
                      </button>
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
