# Rodar o TimeFlow localmente com Docker (frontend + backend + banco)

Este guia mostra como subir o projeto **inteiro** na sua máquina — frontend,
backend e banco de dados — com **conversa real entre front e back** (sem o modo
preview de fixtures).

---

## 1. Contexto importante (leia antes)

O frontend do TimeFlow **não tem backend embutido**. Em produção, quem responde
`/data/*` e `/auth/*` é o **MasIA tenant-gateway** (serviço compartilhado, fora
deste repositório). Sem ele, o app roda em **modo preview** com dados falsos em
memória (`preview-fixtures.ts`).

Para o desenvolvimento local ficar **funcional de verdade**, este repositório
agora inclui um **gateway local** (`local-gateway/`) que implementa o mesmo
contrato do gateway de produção, mas gravando em um **Postgres real**.

```text
┌───────────────┐      /data /auth       ┌───────────────┐      SQL      ┌───────────┐
│  web (Vite)   │  ───────────────────▶  │  gateway (Node)│  ─────────▶  │ Postgres  │
│  :5173        │  ◀───────────────────  │  :8787         │  ◀─────────  │ :5432     │
└───────────────┘   cookie de sessão     └───────────────┘   migrations  └───────────┘
```

O gateway local:
- roda as migrations de `db/migrations/` no boot;
- cria a tabela `user` (Better-Auth-like) e faz login por cookie de sessão;
- define `owner_id` pela sessão (o front **nunca** manda `owner_id`);
- isola cada usuário (multi-tenant): você só vê seus próprios dados;
- cria um **seed de demonstração** no primeiro cadastro.

---

## 2. Subir tudo

Pré-requisito: **Docker** + **Docker Compose**.

```bash
docker compose up --build
```

Aguarde as três mensagens de saúde e acesse:

| Serviço | URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| Gateway (health) | http://localhost:8787/health |
| Postgres | localhost:5432 (user `masia` / senha `masia_dev` / db `tenant_local`) |

### Primeiro acesso
1. Abra http://localhost:5173 → você cai na tela de login.
2. Clique em **Criar conta** e cadastre um e-mail/senha.
   - O **primeiro usuário** vira **admin** e recebe dados de demonstração.
3. Pronto: navegue por Dashboard, Clientes, Projetos, Timer, etc. Tudo o que
   você criar é **persistido no Postgres** e sobrevive a reinícios.

Parar tudo: `Ctrl+C` e depois `docker compose down`.
Zerar o banco: `docker compose down -v` (apaga o volume `masia_pgdata`).

---

## 3. Como a conversa front ↔ back é garantida

- O `docker-compose.yml` injeta `VITE_GATEWAY_URL=http://localhost:8787` no
  container `web`. O `src/lib/data/client.ts` usa essa URL como base de todas as
  chamadas.
- Como `VITE_GATEWAY_URL` está definido, o **modo preview NÃO é ativado**
  (`installPreviewFetch` só roda quando a URL está vazia).
- O gateway responde com **CORS + credenciais** e envia um cookie `masia_sid`
  (`SameSite=Lax`). Como `:5173` e `:8787` são o mesmo site (`localhost`), o
  cookie é enviado automaticamente nas requisições autenticadas.

### Alternativa sem variável de ambiente
O `client.ts` também aceita a base do gateway pela query string:
```text
http://localhost:5173/?gw=http://localhost:8787
```

---

## 4. Auditoria do projeto (o que foi verificado)

### ✅ Conforme / funcionando
- **Contrato de dados** (`client.ts`): `db.table().list/create/update/remove`,
  `credentials: 'include'`, header `X-Tenant-Id`. Não foi alterado.
- **Schema** (`db/migrations/0001_business_schema.sql`): `owner_id text
  references "user"(id)` em todas as tabelas, `snake_case`, sem RLS. Aplicado
  com sucesso pelo gateway local (testado).
- **Isolamento multi-tenant**: cada request só lê/escreve linhas do próprio
  `owner_id` (testado — `owner_id`/`id` enviados pelo cliente são ignorados).
- **Auth**: sign-up/sign-in/sign-out/me por cookie; 1º usuário = admin (testado).
- **Moeda**: BRL em todo o app e no seed.
- **Sem** `@supabase`, sem fetch cru ao banco, sem driver SQL no browser.

### ⚠️ Pontos de atenção (não bloqueiam o local, mas valem correção futura)
Detalhados em `fix.md`. Os principais:
1. **Stack diverge do contrato oficial**: o projeto está em **TanStack Start
   (SSR)**, mas o template `vite-react-gateway` pede **Vite SPA + react-router-dom**.
   Sintoma visível: *warning de hydration* no console. Funciona localmente, mas
   foge da fundação esperada pelo hub.
2. **Migrations em `db/migrations/`** — o publisher oficial espera
   `supabase/migrations/`.
3. **Preview mode** usa o gate `!VITE_GATEWAY_URL`; o contrato pede
   `window.__MASI_PREVIEW__`.
4. **`masi.template.json`**: `protect` incompleto e a tela `settings` aponta para
   arquivo inexistente.

> O gateway local em `local-gateway/` é **apenas para desenvolvimento**. Em
> produção, o backend continua sendo o gateway compartilhado da MasIA — nada
> aqui substitui isso.

---

## 5. Arquivos adicionados para o ambiente local

```text
local-gateway/
  server.mjs        # gateway HTTP (Node puro + pg) implementando /data e /auth
  package.json      # dependência: pg
  Dockerfile        # imagem do gateway
docker-compose.yml  # db + gateway + web, já conectados
```

## 6. Troubleshooting

| Sintoma | Causa provável | Solução |
| --- | --- | --- |
| App mostra dados “fake” e não persiste | `VITE_GATEWAY_URL` não chegou ao front | Confirme o `environment` do serviço `web`; ou abra com `?gw=http://localhost:8787` |
| 401 em `/data/*` | Sem sessão | Faça login; confira se o cookie `masia_sid` está sendo enviado |
| Gateway não sobe | Postgres ainda iniciando | O gateway espera o `db`; veja `docker compose logs gateway` |
| Porta 5173/8787/5432 ocupada | Outro processo local | Ajuste o mapeamento de portas no `docker-compose.yml` |
