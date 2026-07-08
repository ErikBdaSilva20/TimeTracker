import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import {
  PageBody,
  PageHeader,
  EmptyState,
  FormField,
  ResponsiveTable,
} from "@/components/layout/PageHeader";
import { contactsRepo, clientsRepo, type ContactRow } from "@/lib/data";
import { useConfirm } from "@/hooks/useConfirm";

export function ContactsScreen() {
  const qc = useQueryClient();
  const contactsQ = useQuery({ queryKey: ["contacts"], queryFn: () => contactsRepo.list() });
  const clientsQ = useQuery({ queryKey: ["clients"], queryFn: () => clientsRepo.list() });
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ContactRow | null>(null);
  const { confirm, dialog } = useConfirm();

  const clientsMap = useMemo(
    () => new Map((clientsQ.data ?? []).map((c) => [c.id, c])),
    [clientsQ.data],
  );

  const contacts = (contactsQ.data ?? []).filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(search.toLowerCase()),
  );

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload: Partial<ContactRow> = {
      name: String(fd.get("name") || ""),
      role: String(fd.get("role") || "") || null,
      department: String(fd.get("department") || "") || null,
      email: String(fd.get("email") || "") || null,
      phone: String(fd.get("phone") || "") || null,
      client_id: String(fd.get("client_id") || "") || null,
      notes: String(fd.get("notes") || "") || null,
    };
    try {
      if (editing) await contactsRepo.update(editing.id, payload);
      else await contactsRepo.create(payload);
      toast.success(editing ? "Contato atualizado" : "Contato criado");
      setShowForm(false);
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["contacts"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  };

  const onDelete = async (id: string) => {
    if (!(await confirm("Excluir contato?"))) return;
    await contactsRepo.remove(id);
    qc.invalidateQueries({ queryKey: ["contacts"] });
    toast.success("Contato excluído");
  };

  return (
    <>
      {dialog}
      <PageHeader
        title="Contatos"
        description="Pessoas vinculadas aos seus clientes."
        actions={
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-[var(--primary-hover)]"
          >
            <Plus className="h-4 w-4" /> Novo contato
          </button>
        }
      />
      <PageBody>
        <div className="flex items-center gap-3">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar contatos..."
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        {showForm && (
          <form onSubmit={onSubmit} className="card-surface space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField name="name" label="Nome" required defaultValue={editing?.name} />
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  Cliente
                </label>
                <select
                  name="client_id"
                  defaultValue={editing?.client_id ?? ""}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                >
                  <option value="">—</option>
                  {(clientsQ.data ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <FormField name="role" label="Cargo" defaultValue={editing?.role ?? ""} />
              <FormField
                name="department"
                label="Departamento"
                defaultValue={editing?.department ?? ""}
              />
              <FormField
                name="email"
                label="E-mail"
                type="email"
                defaultValue={editing?.email ?? ""}
              />
              <FormField name="phone" label="Telefone" defaultValue={editing?.phone ?? ""} />
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  Notas
                </label>
                <textarea
                  name="notes"
                  defaultValue={editing?.notes ?? ""}
                  rows={2}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
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

        {contactsQ.isLoading ? (
          <div className="card-surface">Carregando…</div>
        ) : contacts.length === 0 ? (
          <EmptyState
            title="Nenhum contato ainda"
            description="Adicione as pessoas com quem você fala em cada cliente."
          />
        ) : (
          <ResponsiveTable>
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-[var(--background-tertiary)] text-[var(--text-muted)]">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Contato</th>
                  <th className="px-5 py-3 text-left font-medium">Cliente</th>
                  <th className="px-5 py-3 text-left font-medium">Cargo</th>
                  <th className="px-5 py-3 text-left font-medium">E-mail</th>
                  <th className="px-5 py-3 text-left font-medium">Telefone</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-[var(--border)] hover:bg-[var(--surface-hover)]"
                  >
                    <td className="px-5 py-3 font-medium">{c.name}</td>
                    <td className="px-5 py-3 text-[var(--text-secondary)]">
                      {c.client_id ? clientsMap.get(c.client_id)?.name || "—" : "—"}
                    </td>
                    <td className="px-5 py-3 text-[var(--text-secondary)]">{c.role || "—"}</td>
                    <td className="px-5 py-3 text-[var(--text-secondary)]">{c.email || "—"}</td>
                    <td className="px-5 py-3 text-[var(--text-secondary)]">{c.phone || "—"}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => {
                          setEditing(c);
                          setShowForm(true);
                        }}
                        className="mr-2 text-xs text-[var(--secondary)] hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onDelete(c.id)}
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
