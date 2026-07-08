import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { isPreviewMode } from "@/lib/preview";

export function LoginScreen() {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  // Starts false (SSR-safe: window/env aren't reliably known during server
  // render) and flips in an effect — the demo shortcut only ever appears in
  // an actual preview build, never accidentally shipped to a real tenant
  // (audit 5.3: this used to prefill unconditionally).
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/dashboard");
  }, [loading, user, navigate]);

  useEffect(() => {
    if (isPreviewMode()) {
      setIsDemo(true);
      setEmail("demo@timeflow.dev");
      setPassword("demo1234");
    }
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") await signIn(email, password);
      else await signUp(email, password, name);
      toast.success("Bem-vindo(a) ao TimeFlow");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao autenticar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Timer className="h-6 w-6" />
          </div>
          <div className="mt-4 text-xl font-semibold">TimeFlow</div>
          <div className="text-sm text-[var(--text-muted)]">Work · Time · Billing</div>
        </div>

        <form onSubmit={onSubmit} className="card-surface space-y-4">
          <div className="flex rounded-xl border border-[var(--border)] p-1 text-sm">
            <button
              type="button"
              onClick={() => setMode("in")}
              className={`flex-1 rounded-lg py-1.5 font-medium transition ${mode === "in" ? "bg-[var(--surface-hover)] text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode("up")}
              className={`flex-1 rounded-lg py-1.5 font-medium transition ${mode === "up" ? "bg-[var(--surface-hover)] text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}
            >
              Criar conta
            </button>
          </div>

          {mode === "up" && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Nome
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-primary"
                placeholder="Seu nome"
              />
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              E-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="voce@empresa.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              Senha
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-[var(--primary-hover)] disabled:opacity-60"
          >
            {busy ? "Aguarde..." : mode === "in" ? "Entrar" : "Criar conta"}
          </button>
          {isDemo && (
            <p className="pt-1 text-center text-[11px] text-[var(--text-muted)]">
              Modo preview: qualquer credencial entra como admin demo.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
