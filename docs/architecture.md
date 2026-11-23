# Arquitetura

Monólito modular em um único deploy Next.js (PRD §6). Sem API separada, sem Redis no MVP.

## Stack

| Camada | Tecnologia | Observação |
|---|---|---|
| Framework | Next.js 16.4 (App Router, Turbopack) | `cacheComponents` e `partialPrefetching` ligados; `proxy.ts` substitui `middleware.ts` |
| UI | React 19.3, Tailwind CSS v4, lucide-react | Tokens do Figma em `src/app/globals.css` |
| Dados | PostgreSQL 17, Prisma 7.10 | `prisma.config.ts`, generator `prisma-client` (saída `src/generated/prisma`), `@prisma/adapter-pg` |
| Auth | Auth.js v5 (`next-auth@beta`) | Credentials + JWT; `auth.config.ts` (sem banco, usado no proxy) e `auth.ts` (com banco) |
| Validação | Zod 4 | Schemas em `presentation/schemas` |
| Pagamentos | Stripe Billing | Checkout + webhook assinado e idempotente |
| Notificações | Web Push (VAPID) + Service Worker | Envio via outbox |
| Testes | Vitest, Playwright | Unitários no domínio; e2e mobile |
| Deploy | Docker (`output: "standalone"`) + Coolify | Cron chama o processador do outbox |

## Camadas

```
app/ (rotas, páginas, route handlers)        ← entrada HTTP: valida, resolve sessão/tenant
  └─ modules/<m>/presentation (actions, schemas)
       └─ modules/<m>/application (casos de uso, ports)
            └─ modules/<m>/domain (regras puras)
       modules/<m>/infrastructure (Prisma, Stripe, web-push) implementa os ports
composition-root.ts liga casos de uso ↔ implementações
```
Regra: **`domain/` não importa Prisma, Next nem Stripe.** Casos de uso dependem de interfaces (`application/ports`).

## Módulos

| Módulo | Responsabilidade | Principais arquivos |
|---|---|---|
| identity | Cadastro, login, sessão, DAL | `use-cases/register-owner.ts`, `authenticate-owner.ts`, `require-owner.ts`, `presentation/actions/auth-actions.ts` |
| tenants | Barbearia, slug, página pública | `domain/slug.ts`, `use-cases/get-public-tenant.ts` |
| billing | Assinatura e liberação do agendamento | `domain/booking-gate.ts`, `use-cases/handle-stripe-webhook.ts`, `create-checkout-session.ts` |
| catalog | Serviços | `use-cases/create-service.ts`, `list-public-services.ts` |
| professionals | Barbeiros (sem login) | `use-cases/list-public-professionals.ts` |
| scheduling | Motor de disponibilidade | `domain/availability.ts`, `use-cases/get-available-slots.ts`, `infrastructure/prisma/…` |
| appointments | Criar, cancelar, agenda | `use-cases/create-appointment.ts`, `cancel-appointment-by-token.ts`, `list-agenda.ts` |
| customers | Cliente por telefone (upsert) | dentro do repositório de appointments (a extrair no RF-16) |
| notifications | Outbox e Web Push | `domain/messages.ts`, `use-cases/process-outbox.ts`, `infrastructure/web-push-sender.ts` |

`src/shared/`: `database` (cliente Prisma, códigos de erro do Postgres), `security` (senha, tokens, rate limit), `errors` (AppError → resposta HTTP), `utils` (telefone, dinheiro, relógio).

## Multitenancy (RN-01)
- Admin: `requireOwner()` lê o `tenantId` **da sessão** (JWT do Auth.js). Nunca aceitar `tenantId` do navegador.
- Público: tenant resolvido pelo **slug**.
- Toda query filtra `tenantId`; relações usam FK composta `(tenantId, id)` → referência cruzada entre barbearias é impossível no banco.

## Fluxo: criar agendamento (RF-10)
```
POST /api/public/:slug/appointments
  1. rate limit (IP + slug) + honeypot + Zod
  2. getPublicTenant(slug) → assinatura libera? (booking-gate)
  3. CreateAppointment
       a. normaliza telefone (E.164)
       b. recalcula horários livres; o horário pedido precisa estar na lista   ← 1ª barreira
       c. transação: upsert Customer → Appointment (snapshots, hash do token) → OutboxEvent
       d. EXCLUDE constraint rejeita sobreposição concorrente → 409 SLOT_UNAVAILABLE ← 2ª barreira
  4. responde 201 com link de cancelamento (token em texto só aqui)
cron → POST /api/jobs/process-outbox → Web Push para os aparelhos do dono
```

## Motor de disponibilidade (PRD §9)
`computeAvailableSlots()` em `scheduling/domain/availability.ts`:
1. janelas de trabalho do dia da semana (minutos locais; intervalo = duas janelas)
2. descarta bloqueios parciais; folga = vazio
3. gera candidatos a cada `slotIntervalMinutes` que caibam inteiros na janela
4. converte para UTC com o fuso da barbearia (`@date-fns/tz`)
5. remove sobreposição com agendamentos CONFIRMED (intervalos semiabertos `[início, fim)`)
6. aplica antecedência mínima e limite de dias
Cobertura: `tests/unit/availability.test.ts` (inclui o exemplo do PRD).

## Assinatura (RN-02)
| Status | Agendamento público |
|---|---|
| TRIALING, ACTIVE | liberado |
| PAST_DUE | liberado até `currentPeriodEnd + 3 dias` |
| CANCELED | liberado até `currentPeriodEnd` |
| UNPAID, INCOMPLETE, PAUSED… | bloqueado |
Estado sincronizado **somente** por webhook (`customer.subscription.*`, `checkout.session.completed`), com idempotência pela tabela `StripeEvent`.

## Notificações (RN-07)
- O evento vai para `OutboxEvent` na mesma transação do agendamento → falha de push nunca derruba a reserva.
- Processador: `UPDATE … FOR UPDATE SKIP LOCKED`, até 5 tentativas com backoff exponencial.
- Inscrições 404/410 são desativadas. Só aparelhos do proprietário do tenant recebem.

## Next.js 16 — cuidados
- Com `cacheComponents`, leitura de sessão/cookies fica dentro de `<Suspense>` (ver `painel/agenda/page.tsx`).
- `params` é Promise; use `PageProps<'/rota'>`, `LayoutProps`, `RouteContext<'/rota'>` (tipos gerados por `next typegen`).
- `typedRoutes` ligado: links internos são checados em tempo de compilação.
- Antes de usar uma API do Next, consulte `node_modules/next/dist/docs/` (ver `AGENTS.md`).
