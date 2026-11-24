# Deploy no Coolify

A aplicação sobe como uma imagem Docker (build pack **Dockerfile**) ao lado de um Postgres 17 criado no próprio Coolify.
As migrações rodam quando o container inicia: `prisma migrate deploy` e, só se der certo, `node server.js`.
Se a migração falhar, o container não fica saudável e o Coolify mantém a versão anterior no ar.

> Não use o *Pre-deployment command* para migrar: ele roda no container **antigo** e é pulado no primeiro deploy
> ([Coolify › Configuration › General](https://coolify.io/docs/applications/configuration/general)).

## 1. Banco

1. No projeto do Coolify: **+ New → Database → PostgreSQL 17**.
2. Copie a **Postgres URL (internal)** — ela vira o `DATABASE_URL` da aplicação. Acrescente `?schema=public` no fim.
3. Ative backups agendados do banco (aba *Backups*).

## 2. Aplicação

**+ New → Public/Private Repository → GitHub** e escolha `berguisonpaiva/barber-saas`, branch `main`.

| Campo | Valor |
|---|---|
| Build Pack | Dockerfile |
| Base Directory | `/` |
| Dockerfile Location | `/Dockerfile` |
| Ports Exposes | `3000` |
| Domains | `https://SEU_DOMINIO` |
| Pre-deployment command | vazio |

### Health check (aba *Healthcheck*)

Ative com método `GET`, host **`127.0.0.1`**, caminho `/login`, porta `3000`, start period `30` s.
A imagem é Alpine: tem `wget` (BusyBox), não `curl` — o Coolify aceita qualquer um dos dois
([Health checks](https://coolify.io/docs/applications/configuration/health-checks)).
Não deixe o host como `localhost`: dentro do container ele resolve para `::1` (IPv6) e o servidor escuta só em
IPv4 (`0.0.0.0`), então a checagem recebe *connection refused* e o deploy nunca fica saudável.

## 3. Variáveis de ambiente

As duas `NEXT_PUBLIC_*` são copiadas para o código **no build** — deixe-as disponíveis em *Build time*
(o Dockerfile as declara como `ARG`). Todas as outras são só de *Runtime*: marque **Runtime only** para que segredos
não virem argumento de build ([Environment variables](https://coolify.io/docs/applications/configuration/environment-variables)).

| Variável | Escopo | Valor |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Build + Runtime | `https://SEU_DOMINIO` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Build + Runtime | chave pública de `npx web-push generate-vapid-keys` |
| `DATABASE_URL` | Runtime | URL interna do Postgres + `?schema=public` |
| `AUTH_SECRET` | Runtime | `npx auth secret` |
| `AUTH_TRUST_HOST` | Runtime | `true` (atrás do proxy do Coolify) |
| `VAPID_PRIVATE_KEY` | Runtime | chave privada do mesmo par |
| `VAPID_SUBJECT` | Runtime | `mailto:` de contato |
| `STRIPE_SECRET_KEY` | Runtime | `sk_live_…` (ou `sk_test_…` em homologação) |
| `STRIPE_WEBHOOK_SECRET` | Runtime | `whsec_…` do endpoint abaixo |
| `STRIPE_PRICE_PRO`, `STRIPE_PRICE_SOLO` | Runtime | ids `price_…` |
| `STRIPE_TRIAL_DAYS` | Runtime | `14` |
| `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET` | Runtime | bucket com leitura pública (ex.: Cloudflare R2) |
| `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Runtime | chaves do bucket |
| `S3_FORCE_PATH_STYLE` | Runtime | `true` para R2/MinIO/RustFS |
| `S3_PUBLIC_URL` | Runtime | URL pública do bucket |
| `CRON_SECRET` | Runtime | segredo longo aleatório |

Trocou uma `NEXT_PUBLIC_*`? Faça **Redeploy** (novo build); reiniciar não basta.

## 4. Tarefa agendada do outbox

Aba **Scheduled Tasks → + Add**. O comando roda dentro do container da aplicação
([Scheduled tasks](https://coolify.io/docs/applications/operations/scheduled-tasks)):

| Campo | Valor |
|---|---|
| Name | `process-outbox` |
| Frequency | `every_minute` |
| Command | `wget -qO- --header "Authorization: Bearer $CRON_SECRET" --post-data "" http://127.0.0.1:3000/api/jobs/process-outbox` |

## 5. Stripe

No painel do Stripe, crie o endpoint `https://SEU_DOMINIO/api/stripe/webhook` com os eventos de assinatura e copie o
segredo para `STRIPE_WEBHOOK_SECRET`.

## 6. Conferência após o primeiro deploy

- Log do container começa com `prisma migrate deploy` e `All migrations have been successfully applied.`
- `https://SEU_DOMINIO/login` abre.
- A execução de `process-outbox` aparece em *Scheduled Tasks* com resposta `{"claimed":…,"done":…,"retried":…}`.

## Banco local já existente

Bancos de desenvolvimento criados antes de `prisma/migrations/20261124000000_init` não têm histórico de migração.
Marque a inicial como aplicada uma vez: `npx prisma migrate resolve --applied 20261124000000_init`.
