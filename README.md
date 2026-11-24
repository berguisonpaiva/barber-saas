# Barber SaaS

Agendamento online para barbearias: página pública por link (cliente sem login) e painel PWA do proprietário com notificações.

- Produto: [`docs/PRD.md`](docs/PRD.md)
- Design (Figma): https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy · tokens em [`docs/design-system.md`](docs/design-system.md)
- Guia de arquitetura e regras: [`CLAUDE.md`](CLAUDE.md)

## Requisitos
- Node.js 22+ (recomendado 24)
- Docker Desktop (para o Postgres local)

## Primeira execução (Windows / PowerShell)
```powershell
cd C:\Capivara\barber-saas
copy .env.example .env          # depois edite AUTH_SECRET (npx auth secret)
npm install                     # também roda "prisma generate"
npm run db:up                   # sobe o Postgres no Docker
npm run storage:up              # sobe o storage S3 (RustFS) da foto de capa
npm run storage:init            # cria o bucket e libera leitura pública
npm run db:init                 # aplica as migrações versionadas (inclui as constraints)
npm run db:seed                 # Barbearia do João (joao@demo.com / barber123)
npm run dev                     # http://localhost:3000
```
Páginas para testar: `/` · `/login` · `/barbearia-do-joao` · `/painel/agenda`.

## Scripts
| Script | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento (Turbopack) |
| `npm run typecheck` / `lint` / `test` | TypeScript, ESLint, Vitest |
| `npm test` com `DATABASE_URL_TEST` e `S3_TEST_ENDPOINT` | inclui os testes de integração (Postgres `*_test` e storage S3) |
| `npm run storage:up` / `storage:init` | storage S3 local (RustFS) e criação do bucket |
| `npm run test:e2e` | Playwright (perfil mobile) |
| `npm run db:migrate` | nova migração após mudar o `schema.prisma` |
| `npm run db:studio` | Prisma Studio |

## API pública (página da barbearia)
```
GET  /api/public/:slug/services
GET  /api/public/:slug/professionals?serviceId=
GET  /api/public/:slug/availability?serviceId=&professionalId=&date=AAAA-MM-DD
POST /api/public/:slug/appointments
POST /api/public/:slug/appointments/cancel
POST /api/stripe/webhook
POST|DELETE /api/push/subscribe
POST /api/jobs/process-outbox        (Authorization: Bearer $CRON_SECRET)
```

## Stripe local
```
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
Copie o `whsec_...` para `STRIPE_WEBHOOK_SECRET`.

## Deploy (Coolify)
Passo a passo completo em [`docs/deploy.md`](docs/deploy.md). Em resumo: build pelo `Dockerfile`, porta `3000`,
migrações aplicadas ao iniciar o container (sem comando de pré-deploy), `NEXT_PUBLIC_*` disponíveis no build e
tarefa agendada `every_minute` chamando `/api/jobs/process-outbox` com `wget` (a imagem não tem `curl`).

## Status
Pronto: schema multitenant com FKs compostas e exclusion constraint, motor de disponibilidade com testes,
casos de uso de agendamento/cancelamento, API pública, Auth.js, Stripe (checkout + webhook idempotente),
outbox + Web Push, PWA, tokens do design system, telas base (login, cadastro, agenda, página pública).

Também pronto: fluxo completo de agendamento e cancelamento na página pública (telas C1–C7), link de
agendamento gerado no cadastro, foto de capa da barbearia (storage S3).

Próximos passos: CRUD de serviços/equipe/horários (P3–P7), testes de isolamento multitenant com banco.
