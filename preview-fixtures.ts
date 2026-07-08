// Preview mode: intercepts fetch() to the MasIA gateway and answers from
// an in-memory dataset. Enable by setting window.__MASI_PREVIEW__ = true
// (or leaving VITE_GATEWAY_URL unset — see main.tsx).

type Row = Record<string, unknown> & { id: string; owner_id: string };
type Store = Record<string, Row[]>;

const OWNER = "u_demo";
const now = () => new Date().toISOString();
const uid = () => `id_${Math.random().toString(36).slice(2, 10)}`;

function stamp<T extends Record<string, unknown>>(input: Partial<T>): Row {
  const iso = now();
  return {
    id: uid(),
    owner_id: OWNER,
    created_at: iso,
    updated_at: iso,
    ...input,
  } as Row;
}

function seed(): Store {
  const clients: Row[] = [
    stamp({
      name: "Northwind Studios",
      company: "Northwind LLC",
      email: "hi@northwind.co",
      status: "active",
      default_hour_rate: 180,
      notes: null,
      phone: null,
      website: null,
    }),
    stamp({
      name: "Aurora Health",
      company: "Aurora Inc.",
      email: "ops@aurora.io",
      status: "active",
      default_hour_rate: 220,
      notes: null,
      phone: null,
      website: null,
    }),
    stamp({
      name: "Blue Harbor",
      company: "Blue Harbor Partners",
      email: "team@blueharbor.com",
      status: "inactive",
      default_hour_rate: 150,
      notes: null,
      phone: null,
      website: null,
    }),
  ];

  const members: Row[] = [
    stamp({
      name: "Ana Souza",
      email: "ana@timeflow.dev",
      role: "manager",
      hourly_rate: 180,
      weekly_goal: 40,
      active: true,
    }),
    stamp({
      name: "Bruno Lima",
      email: "bruno@timeflow.dev",
      role: "rep",
      hourly_rate: 140,
      weekly_goal: 40,
      active: true,
    }),
    stamp({
      name: "Carla Dias",
      email: "carla@timeflow.dev",
      role: "rep",
      hourly_rate: 160,
      weekly_goal: 40,
      active: true,
    }),
  ];

  const projects: Row[] = [
    stamp({
      client_id: clients[0].id,
      name: "Website Redesign",
      description: "Refresh do site institucional",
      color: "#22c55e",
      status: "active",
      estimated_hours: 120,
      hourly_rate: 180,
      budget: 22000,
      start_date: "2025-01-05",
      end_date: null,
    }),
    stamp({
      client_id: clients[0].id,
      name: "Design System v2",
      description: "Componentes e tokens",
      color: "#60a5fa",
      status: "active",
      estimated_hours: 80,
      hourly_rate: 180,
      budget: 15000,
      start_date: "2025-02-01",
      end_date: null,
    }),
    stamp({
      client_id: clients[1].id,
      name: "Patient Portal",
      description: "Portal de pacientes",
      color: "#f59e0b",
      status: "active",
      estimated_hours: 200,
      hourly_rate: 220,
      budget: 48000,
      start_date: "2025-01-15",
      end_date: null,
    }),
    stamp({
      client_id: clients[2].id,
      name: "Landing Beta",
      description: "Landing page beta",
      color: "#a78bfa",
      status: "paused",
      estimated_hours: 40,
      hourly_rate: 150,
      budget: 6000,
      start_date: null,
      end_date: null,
    }),
  ];

  const tasks: Row[] = [
    stamp({
      project_id: projects[0].id,
      name: "Wireframes home",
      priority: "high",
      status: "in_progress",
      estimated_hours: 12,
      member_id: members[0].id,
    }),
    stamp({
      project_id: projects[0].id,
      name: "Copywriting",
      priority: "medium",
      status: "todo",
      estimated_hours: 8,
      member_id: members[1].id,
    }),
    stamp({
      project_id: projects[1].id,
      name: "Tokens de cor",
      priority: "high",
      status: "done",
      estimated_hours: 6,
      member_id: members[0].id,
    }),
    stamp({
      project_id: projects[2].id,
      name: "Fluxo de login",
      priority: "urgent",
      status: "in_progress",
      estimated_hours: 20,
      member_id: members[2].id,
    }),
    stamp({
      project_id: projects[2].id,
      name: "Dashboard médico",
      priority: "medium",
      status: "review",
      estimated_hours: 32,
      member_id: members[1].id,
    }),
  ];

  // Build ~24 time entries across the last 14 days.
  const time_entries: Row[] = [];
  const today = new Date();
  for (let i = 0; i < 24; i++) {
    const dayOffset = i % 14;
    const d = new Date(today);
    d.setDate(today.getDate() - dayOffset);
    const date = d.toISOString().slice(0, 10);
    const p = projects[i % projects.length];
    const t = tasks[i % tasks.length];
    const m = members[i % members.length];
    const c = clients.find((x) => x.id === p.client_id)!;
    const duration = [30, 45, 60, 75, 90, 120, 180][i % 7];
    time_entries.push(
      stamp({
        client_id: c.id,
        project_id: p.id,
        task_id: t.id,
        member_id: m.id,
        date,
        start_time: null,
        end_time: null,
        duration_minutes: duration,
        billable: i % 5 !== 0,
        notes: null,
        client_name: c.name,
        project_name: p.name,
        task_name: t.name,
        member_name: m.name,
        hour_rate: p.hourly_rate ?? 150,
        currency: "BRL",
      }),
    );
  }

  const settings: Row[] = [
    stamp({
      currency: "BRL",
      timezone: "America/Sao_Paulo",
      default_hour_rate: 150,
      workdays: [1, 2, 3, 4, 5],
      date_format: "yyyy-MM-dd",
      timer_preferences: {},
    }),
  ];

  return {
    clients,
    contacts: [],
    projects,
    tasks,
    members,
    work_schedules: [],
    goals: [],
    tags: [],
    timer_sessions: [],
    time_entries,
    time_entry_tags: [],
    invoices: [],
    invoice_items: [],
    settings,
  };
}

const STORE_KEY = "__masi_timeflow_store__";
const AUTH_KEY = "__masi_timeflow_auth__";

function loadStore(): Store {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch {
    /* ignore */
  }
  const s = seed();
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
  return s;
}

function saveStore(s: Store) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

interface AuthState {
  user: { id: string; email: string; name?: string } | null;
  role: "admin" | "manager" | "rep" | null;
}

function loadAuth(): AuthState {
  if (typeof window === "undefined") return { user: null, role: null };
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) return JSON.parse(raw) as AuthState;
  } catch {
    /* ignore */
  }
  return { user: null, role: null };
}

function saveAuth(a: AuthState) {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(a));
  } catch {
    /* ignore */
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export function installPreviewFetch() {
  if (typeof window === "undefined") return;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const method = (init?.method || "GET").toUpperCase();

    // Only intercept relative gateway-style paths.
    const isGatewayPath = url.startsWith("/data/") || url.startsWith("/auth/");
    if (!isGatewayPath) return originalFetch(input as RequestInfo, init);

    const body = init?.body ? JSON.parse(init.body as string) : undefined;

    // Auth
    if (url === "/auth/me") {
      return jsonResponse(loadAuth());
    }
    if (url === "/auth/sign-in/email" && method === "POST") {
      const auth: AuthState = {
        user: { id: OWNER, email: body?.email ?? "demo@timeflow.dev", name: "Demo User" },
        role: "admin",
      };
      saveAuth(auth);
      return jsonResponse({ ok: true });
    }
    if (url === "/auth/sign-up/email" && method === "POST") {
      const auth: AuthState = {
        user: {
          id: OWNER,
          email: body?.email ?? "demo@timeflow.dev",
          name: body?.name ?? "Demo User",
        },
        role: "admin",
      };
      saveAuth(auth);
      return jsonResponse({ ok: true });
    }
    if (url === "/auth/sign-out" && method === "POST") {
      saveAuth({ user: null, role: null });
      return new Response(null, { status: 204 });
    }

    // Data CRUD
    const dataMatch = url.match(/^\/data\/([a-z_]+)(?:\/([^/?]+))?$/);
    if (dataMatch) {
      const [, table, id] = dataMatch;
      const store = loadStore();
      if (!store[table]) store[table] = [];

      if (method === "GET" && !id) {
        return jsonResponse(store[table]);
      }
      if (method === "POST" && !id) {
        const row = stamp({ ...body });
        store[table].push(row);
        saveStore(store);
        return jsonResponse(row);
      }
      if (method === "PATCH" && id) {
        const idx = store[table].findIndex((r) => r.id === id);
        if (idx === -1) return jsonResponse({ error: "not found" }, 404);
        store[table][idx] = { ...store[table][idx], ...body, updated_at: now() };
        saveStore(store);
        return jsonResponse(store[table][idx]);
      }
      if (method === "DELETE" && id) {
        store[table] = store[table].filter((r) => r.id !== id);
        saveStore(store);
        return new Response(null, { status: 204 });
      }
    }

    return jsonResponse({ error: "not implemented in preview" }, 501);
  };
}

export function resetPreviewData() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORE_KEY);
  localStorage.removeItem(AUTH_KEY);
}
