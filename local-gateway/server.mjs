// ─────────────────────────────────────────────────────────────────────────────
// MasIA Local Gateway (dev only)
// ─────────────────────────────────────────────────────────────────────────────
// Implementa localmente o MESMO contrato do tenant-gateway de produção que o
// frontend (src/lib/data/client.ts) espera:
//
//   Dados:  GET/POST   /data/:table
//           PATCH/DELETE /data/:table/:id
//   Auth:   POST /auth/sign-in/email
//           POST /auth/sign-up/email
//           POST /auth/sign-out
//           GET  /auth/me
//
// Regras respeitadas (iguais às da fundação):
//  • `owner_id` é definido pelo servidor a partir da sessão — nunca vem do front.
//  • Cada request só enxerga/edita linhas do próprio `owner_id` (multi-tenant por usuário).
//  • Sem RLS; as regras de negócio vivem aqui.
//  • CORS com credenciais (cookie de sessão).
//
// Este arquivo é APENAS para desenvolvimento local com Docker. Em produção quem
// serve essas rotas é o gateway compartilhado da MasIA.
// ─────────────────────────────────────────────────────────────────────────────

import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const { Pool } = pg;

const PORT = Number(process.env.PORT || 8787);
const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgres://masia:masia_dev@db:5432/tenant_local";
const MIGRATIONS_DIR = process.env.MIGRATIONS_DIR || "/app/migrations";

const pool = new Pool({ connectionString: DATABASE_URL });

// Tabelas de negócio permitidas (whitelist — evita acesso a "user"/"session").
const TABLES = new Set([
  "clients",
  "contacts",
  "projects",
  "tasks",
  "members",
  "work_schedules",
  "goals",
  "tags",
  "timer_sessions",
  "time_entries",
  "time_entry_tags",
  "invoices",
  "invoice_items",
  "settings",
]);

// Colunas jsonb que precisam de JSON.stringify antes do INSERT/UPDATE.
const JSONB_COLUMNS = new Set(["workdays", "timer_preferences"]);

// Sessões em memória: token -> userId. Reinicia quando o container reinicia.
const sessions = new Map();

// ─── Helpers de hashing de senha (scrypt) ────────────────────────────────────
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(candidate));
}

// ─── Bootstrap: cria tabela `user` + roda migrations de negócio ───────────────
async function migrate() {
  await pool.query('create extension if not exists "pgcrypto"');

  // Better-Auth-like user table (o schema de negócio referencia "user"(id)).
  await pool.query(`
    create table if not exists "user" (
      id text primary key,
      email text unique not null,
      name text,
      password_hash text not null,
      role text not null default 'rep',
      created_at timestamptz not null default now()
    )
  `);

  // Roda os .sql da pasta de migrations (idempotentes: usam "if not exists").
  if (fs.existsSync(MIGRATIONS_DIR)) {
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    for (const f of files) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, f), "utf8");
      await pool.query(sql);
      console.log(`[gateway] migration aplicada: ${f}`);
    }
  } else {
    console.warn(`[gateway] pasta de migrations não encontrada: ${MIGRATIONS_DIR}`);
  }
}

// ─── Seed de demonstração para um novo usuário (só se estiver vazio) ──────────
async function seedForUser(ownerId) {
  const { rows } = await pool.query(
    "select count(*)::int as n from clients where owner_id = $1",
    [ownerId],
  );
  if (rows[0].n > 0) return;

  const insert = async (table, obj) => {
    const cols = Object.keys(obj);
    const vals = cols.map((c) =>
      JSONB_COLUMNS.has(c) && obj[c] !== null && typeof obj[c] === "object"
        ? JSON.stringify(obj[c])
        : obj[c],
    );
    const ph = cols.map((_, i) => `$${i + 1}`).join(", ");
    const { rows } = await pool.query(
      `insert into ${table} (owner_id, ${cols.join(", ")}) values ($${cols.length + 1}, ${ph}) returning *`,
      [...vals, ownerId],
    );
    return rows[0];
  };

  const c1 = await insert("clients", { name: "Northwind Studios", company: "Northwind LLC", email: "hi@northwind.co", status: "active", default_hour_rate: 180 });
  const c2 = await insert("clients", { name: "Aurora Health", company: "Aurora Inc.", email: "ops@aurora.io", status: "active", default_hour_rate: 220 });

  const m1 = await insert("members", { name: "Ana Souza", email: "ana@timeflow.dev", role: "manager", hourly_rate: 180, weekly_goal: 40, active: true });
  const m2 = await insert("members", { name: "Bruno Lima", email: "bruno@timeflow.dev", role: "rep", hourly_rate: 140, weekly_goal: 40, active: true });

  const p1 = await insert("projects", { client_id: c1.id, name: "Website Redesign", description: "Refresh do site", color: "#22c55e", status: "active", estimated_hours: 120, hourly_rate: 180, budget: 22000, start_date: "2025-01-05" });
  const p2 = await insert("projects", { client_id: c2.id, name: "Patient Portal", description: "Portal de pacientes", color: "#f59e0b", status: "active", estimated_hours: 200, hourly_rate: 220, budget: 48000, start_date: "2025-01-15" });

  const t1 = await insert("tasks", { project_id: p1.id, name: "Wireframes home", priority: "high", status: "in_progress", estimated_hours: 12, member_id: m1.id });
  await insert("tasks", { project_id: p2.id, name: "Fluxo de login", priority: "urgent", status: "in_progress", estimated_hours: 20, member_id: m2.id });

  const today = new Date();
  for (let i = 0; i < 10; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - (i % 7));
    const p = i % 2 === 0 ? p1 : p2;
    const c = i % 2 === 0 ? c1 : c2;
    const m = i % 2 === 0 ? m1 : m2;
    await insert("time_entries", {
      client_id: c.id, project_id: p.id, task_id: t1.id, member_id: m.id,
      date: d.toISOString().slice(0, 10), duration_minutes: [30, 60, 90, 120][i % 4],
      billable: i % 5 !== 0, client_name: c.name, project_name: p.name,
      task_name: t1.name, member_name: m.name, hour_rate: p.hourly_rate, currency: "BRL",
    });
  }

  await insert("settings", { currency: "BRL", timezone: "America/Sao_Paulo", default_hour_rate: 150, workdays: [1, 2, 3, 4, 5], date_format: "yyyy-MM-dd", timer_preferences: {} });
  console.log(`[gateway] seed de demonstração criado para ${ownerId}`);
}

// ─── Utilidades HTTP ──────────────────────────────────────────────────────────
function send(res, status, body, extraHeaders = {}) {
  const payload = status === 204 ? null : JSON.stringify(body);
  res.writeHead(status, { "content-type": "application/json", ...extraHeaders });
  res.end(payload);
}

function applyCors(req, res) {
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Tenant-Id, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  const out = {};
  header.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx > -1) out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  });
  return out;
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      if (!data) return resolve(undefined);
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve(undefined);
      }
    });
  });
}

async function currentUser(req) {
  const token = parseCookies(req)["masia_sid"];
  if (!token) return null;
  const userId = sessions.get(token);
  if (!userId) return null;
  const { rows } = await pool.query(
    'select id, email, name, role from "user" where id = $1',
    [userId],
  );
  return rows[0] || null;
}

function setSessionCookie(res, token) {
  // SameSite=Lax funciona entre localhost:5173 e localhost:8787 (mesmo site).
  res.setHeader(
    "Set-Cookie",
    `masia_sid=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800`,
  );
}

// ─── Handlers de autenticação ─────────────────────────────────────────────────
async function handleAuth(req, res, url) {
  const method = req.method || "GET";

  if (url === "/auth/me" && method === "GET") {
    const user = await currentUser(req);
    return send(res, 200, user ? { user: { id: user.id, email: user.email, name: user.name }, role: user.role } : { user: null, role: null });
  }

  if (url === "/auth/sign-up/email" && method === "POST") {
    const body = (await readBody(req)) || {};
    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "");
    if (!email || !password) return send(res, 400, { error: "email e senha obrigatórios" });

    const exists = await pool.query('select id from "user" where email = $1', [email]);
    if (exists.rows.length) return send(res, 409, { error: "e-mail já cadastrado" });

    // O primeiro usuário do tenant vira admin (igual à regra da fundação).
    const count = await pool.query('select count(*)::int as n from "user"');
    const role = count.rows[0].n === 0 ? "admin" : "rep";

    const id = `u_${crypto.randomBytes(8).toString("hex")}`;
    await pool.query(
      'insert into "user" (id, email, name, password_hash, role) values ($1,$2,$3,$4,$5)',
      [id, email, body.name || null, hashPassword(password), role],
    );
    await seedForUser(id);

    const token = crypto.randomBytes(24).toString("hex");
    sessions.set(token, id);
    setSessionCookie(res, token);
    return send(res, 200, { ok: true });
  }

  if (url === "/auth/sign-in/email" && method === "POST") {
    const body = (await readBody(req)) || {};
    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "");
    const { rows } = await pool.query('select * from "user" where email = $1', [email]);
    const user = rows[0];
    if (!user || !verifyPassword(password, user.password_hash)) {
      return send(res, 401, { error: "credenciais inválidas" });
    }
    const token = crypto.randomBytes(24).toString("hex");
    sessions.set(token, user.id);
    setSessionCookie(res, token);
    return send(res, 200, { ok: true });
  }

  if (url === "/auth/sign-out" && method === "POST") {
    const token = parseCookies(req)["masia_sid"];
    if (token) sessions.delete(token);
    res.setHeader("Set-Cookie", "masia_sid=; HttpOnly; Path=/; Max-Age=0");
    return send(res, 204, null);
  }

  return send(res, 404, { error: "auth route not found" });
}

// ─── Handlers de dados (CRUD genérico, escopado por owner_id) ─────────────────
async function handleData(req, res, url) {
  const user = await currentUser(req);
  if (!user) return send(res, 401, { error: "não autenticado" });

  const method = req.method || "GET";
  const match = url.match(/^\/data\/([a-z_]+)(?:\/([^/?]+))?$/);
  if (!match) return send(res, 404, { error: "rota inválida" });

  const [, table, id] = match;
  if (!TABLES.has(table)) return send(res, 403, { error: "tabela não permitida" });

  // LIST
  if (method === "GET" && !id) {
    const { rows } = await pool.query(
      `select * from ${table} where owner_id = $1 order by created_at desc`,
      [user.id],
    );
    return send(res, 200, rows);
  }

  // CREATE
  if (method === "POST" && !id) {
    const body = (await readBody(req)) || {};
    // Nunca confiar em owner_id/id/timestamps vindos do cliente.
    delete body.id;
    delete body.owner_id;
    delete body.created_at;
    delete body.updated_at;

    const cols = Object.keys(body).filter((c) => /^[a-z_]+$/.test(c));
    const vals = cols.map((c) =>
      JSONB_COLUMNS.has(c) && body[c] !== null && typeof body[c] === "object"
        ? JSON.stringify(body[c])
        : body[c],
    );
    const ph = cols.map((_, i) => `$${i + 1}`).join(", ");
    const colList = cols.length ? `owner_id, ${cols.join(", ")}` : "owner_id";
    const valList = cols.length ? `$${cols.length + 1}, ${ph}` : "$1";
    const params = cols.length ? [...vals, user.id] : [user.id];
    const { rows } = await pool.query(
      `insert into ${table} (${colList}) values (${valList}) returning *`,
      params,
    );
    return send(res, 200, rows[0]);
  }

  // UPDATE
  if (method === "PATCH" && id) {
    const body = (await readBody(req)) || {};
    delete body.id;
    delete body.owner_id;
    delete body.created_at;
    const cols = Object.keys(body).filter((c) => /^[a-z_]+$/.test(c));
    if (!cols.length) return send(res, 400, { error: "nada para atualizar" });
    const sets = cols.map((c, i) => `${c} = $${i + 1}`);
    const vals = cols.map((c) =>
      JSONB_COLUMNS.has(c) && body[c] !== null && typeof body[c] === "object"
        ? JSON.stringify(body[c])
        : body[c],
    );
    sets.push("updated_at = now()");
    const { rows } = await pool.query(
      `update ${table} set ${sets.join(", ")} where id = $${cols.length + 1} and owner_id = $${cols.length + 2} returning *`,
      [...vals, id, user.id],
    );
    if (!rows.length) return send(res, 404, { error: "não encontrado" });
    return send(res, 200, rows[0]);
  }

  // DELETE
  if (method === "DELETE" && id) {
    await pool.query(`delete from ${table} where id = $1 and owner_id = $2`, [id, user.id]);
    return send(res, 204, null);
  }

  return send(res, 405, { error: "método não suportado" });
}

// ─── Servidor ─────────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  applyCors(req, res);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const url = (req.url || "").split("?")[0];
  try {
    if (url === "/health") return send(res, 200, { ok: true });
    if (url.startsWith("/auth/")) return await handleAuth(req, res, url);
    if (url.startsWith("/data/")) return await handleData(req, res, url);
    return send(res, 404, { error: "not found" });
  } catch (err) {
    console.error("[gateway] erro:", err);
    return send(res, 500, { error: "erro interno", detail: String(err?.message || err) });
  }
});

// Aguarda o Postgres e sobe.
async function start() {
  for (let i = 0; i < 30; i++) {
    try {
      await pool.query("select 1");
      break;
    } catch {
      console.log("[gateway] aguardando Postgres...");
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  await migrate();
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[gateway] MasIA local gateway rodando em http://0.0.0.0:${PORT}`);
  });
}

start();
