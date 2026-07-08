import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { PageBody, PageHeader, EmptyState, Badge } from "@/components/layout/PageHeader";
import { clientsRepo, type ClientRow } from "@/lib/data";

export function ClientsScreen() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["clients"], queryFn: () => clientsRepo.list() });
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ClientRow | null>(null);

  const clients = (q.data ?? []).filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.company || "").toLowerCase().includes(search.toLowerCase()),
  );

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload: Partial<ClientRow> = {
      name: String(fd.get("name") || ""),
      company: String(fd.get("company") || "") || null,
      email: String(fd.get("email") || "") || null,
      phone: String(fd.get("phone") || "") || null,
      default_hour_rate: Number(fd.get("rate")) || null,
      status: (fd.get("status") as ClientRow["status"]) || "active",
    };
    try {
      if (editing) await clientsRepo.update(editing.id, payload);
      else await clientsRepo.create(payload);
      toast.success(editing ? "Cliente atualizado" : "Cliente criado");
      setShowForm(false); setEditing(null);
      qc.invalidateQueries({ queryKey: ["clients"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Excluir cliente?")) return;
    await clientsRepo.remove(id);
    qc.invalidateQueries({ queryKey: ["clients"] });
    toast.success("Cliente excluído");
  };

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Gerencie clientes, contatos e taxas padrão."
        actions={
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-[var(--primary-hover)]"
          >
            <Plus className="h-4 w-4" /> Novo cliente
          </button>
        }
      />
      <PageBody>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar clientes..."
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        {showForm && (
          <form onSubmit={onSubmit} className="card-surface space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field name="name" label="Nome" required defaultValue={editing?.name} />
              <Field name="company" label="Empresa" defaultValue={editing?.company ?? ""} />
              <Field name="email" label="E-mail" type="email" defaultValue={editing?.email ?? ""} />
              <Field name="phone" label="Telefone" defaultValue={editing?.phone ?? ""} />
              <Field name="rate" label="Valor-hora padrão" type="number" defaultValue={editing?.default_hour_rate ?? ""} />
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Status</label>
                <select name="status" defaultValue={editing?.status ?? "active"} className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm">
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="archived">Arquivado</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm">
                Cancelar
              </button>
              <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-[var(--primary-hover)]">
                Salvar
              </button>
            </div>
          </form>
        )}

        {q.isLoading ? (
          <div className="card-surface">Carregando…</div>
        ) : clients.length === 0 ? (
          <EmptyState title="Nenhum cliente ainda" description="Crie o primeiro cliente para começar a organizar projetos e faturamento." />
        ) : (
          <div className="card-surface overflow-hidden !p-0">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-[var(--background-tertiary)] text-[var(--text-muted)]">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Cliente</th>
                  <th className="px-5 py-3 text-left font-medium">Contato</th>
                  <th className="px-5 py-3 text-left font-medium">Valor/hora</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-hover)]">
                    <td className="px-5 py-3">
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-[var(--text-muted)]">{c.company}</div>
                    </td>
                    <td className="px-5 py-3 text-[var(--text-secondary)]">{c.email || "—"}</td>
                    <td className="px-5 py-3">{c.default_hour_rate ? `$ ${c.default_hour_rate}` : "—"}</td>
                    <td className="px-5 py-3"><Badge tone={c.status === "active" ? "primary" : "muted"}>{c.status}</Badge></td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => { setEditing(c); setShowForm(true); }} className="mr-2 text-xs text-[var(--secondary)] hover:underline">Editar</button>
                      <button onClick={() => onDelete(c.id)} className="text-xs text-red-400 hover:underline">Excluir</button>
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

function Field({ name, label, type = "text", required, defaultValue }: { name: string; label: string; type?: string; required?: boolean; defaultValue?: string | number | null }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">{label}{required && " *"}</label>
      <input name={name} type={type} required={required} defaultValue={defaultValue ?? ""} className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-primary" />
    </div>
  );
}
