import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageBody, PageHeader, FormField, LoadingState } from "@/components/layout/PageHeader";
import { settingsRepo, type SettingsRow } from "@/lib/data";
import { runMutation } from "@/lib/mutations";

// Weekday numbering follows JS Date#getDay() (0 = domingo … 6 = sábado), the
// same convention already used by the preview seed data (workdays: [1..5]).
const WEEKDAYS: { value: number; label: string }[] = [
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
];

const TIMEZONES = [
  "America/Sao_Paulo",
  "America/Manaus",
  "America/Belem",
  "America/Noronha",
  "America/New_York",
  "Europe/Lisbon",
  "UTC",
];

const DATE_FORMATS = [
  { value: "dd/MM/yyyy", label: "31/12/2026 (dd/MM/yyyy)" },
  { value: "yyyy-MM-dd", label: "2026-12-31 (yyyy-MM-dd)" },
  { value: "MM/dd/yyyy", label: "12/31/2026 (MM/dd/yyyy)" },
];

export function SettingsScreen() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["settings"], queryFn: () => settingsRepo.list() });

  // The `settings` table is owner-scoped and holds at most one row per
  // tenant today — the gateway seeds it on first sign-up, but the row may
  // not exist yet in an environment that skipped seeding.
  const existing = (q.data ?? [])[0] ?? null;

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const workdays = WEEKDAYS.map((d) => d.value).filter((v) => fd.get(`workday_${v}`) === "on");
    const payload: Partial<SettingsRow> = {
      // Fixed for now: every amount in the app is formatted as BRL via
      // src/lib/format.ts, which isn't wired to this table yet. Saving
      // anything else here would silently disagree with what the rest of
      // the app displays, so this isn't exposed as an editable field.
      currency: "BRL",
      timezone: String(fd.get("timezone") || "America/Sao_Paulo"),
      default_hour_rate: Number(fd.get("default_hour_rate")) || null,
      date_format: String(fd.get("date_format") || "dd/MM/yyyy"),
      workdays,
    };
    await runMutation(
      () => (existing ? settingsRepo.update(existing.id, payload) : settingsRepo.create(payload)),
      {
        successMessage: "Configurações salvas",
        onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
      },
    );
  };

  return (
    <>
      <PageHeader title="Configurações" description="Preferências gerais da sua conta." />
      <PageBody>
        {q.isLoading ? (
          <LoadingState />
        ) : (
          <form onSubmit={onSubmit} className="card-surface max-w-2xl space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Moeda
              </label>
              <input
                disabled
                value="BRL — Real Brasileiro"
                className="w-full cursor-not-allowed rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] px-3 py-2.5 text-sm text-[var(--text-muted)]"
              />
              <p className="mt-1.5 text-xs text-[var(--text-muted)]">
                Todo o app formata valores em BRL hoje (ver{" "}
                <code className="text-[11px]">src/lib/format.ts</code>); ainda não há suporte a
                outras moedas por tenant.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  Fuso horário
                </label>
                <select
                  name="timezone"
                  defaultValue={existing?.timezone ?? "America/Sao_Paulo"}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  Formato de data
                </label>
                <select
                  name="date_format"
                  defaultValue={existing?.date_format ?? "dd/MM/yyyy"}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                >
                  {DATE_FORMATS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <FormField
                name="default_hour_rate"
                label="Valor-hora padrão"
                type="number"
                defaultValue={existing?.default_hour_rate ?? ""}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Dias úteis
              </label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((d) => (
                  <label
                    key={d.value}
                    className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-[var(--primary-soft)]"
                  >
                    <input
                      type="checkbox"
                      name={`workday_${d.value}`}
                      defaultChecked={(existing?.workdays ?? [1, 2, 3, 4, 5]).includes(d.value)}
                      className="h-3.5 w-3.5"
                    />
                    {d.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-[var(--primary-hover)]"
              >
                Salvar
              </button>
            </div>
          </form>
        )}
      </PageBody>
    </>
  );
}
