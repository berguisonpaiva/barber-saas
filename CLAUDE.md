@AGENTS.md

# Barber SaaS — guia para agentes e devs

SaaS multitenant de agendamento para barbearias. Fonte da verdade do produto: `docs/PRD.md`.
Índice de toda a documentação (arquitetura, banco, API, design system, telas): `docs/README.md`.
Design: Figma https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy (páginas Foundations, Componentes, Telas).

## Stack (versões fixadas — consulte a doc da versão instalada, não a memória)
- Next.js 16.4 (App Router, Turbopack, **cacheComponents ligado**, `proxy.ts` no lugar de `middleware.ts`)
- React 19.3 · TypeScript strict · Tailwind CSS v4 (tokens em `src/app/globals.css`)
- Prisma 7.10 com `prisma.config.ts`, generator `prisma-client` (saída em `src/generated/prisma`) e driver adapter `@prisma/adapter-pg`
- Auth.js v5 (`next-auth@beta`), Credentials + JWT, config dividida (`auth.config.ts` sem banco / `auth.ts` com banco)
- Zod 4 · Stripe · web-push (VAPID) · Vitest · Playwright · Docker + Coolify

## Comandos
```
npm run db:up        # Postgres via Docker
npm run db:init      # 1ª vez: cria a migração init + constraints customizadas e aplica
npm run db:migrate   # novas migrações
npm run db:seed      # dados demo (joao@demo.com / barber123)
npm run dev
npm run typecheck && npm run lint && npm test
```

## Arquitetura (monólito modular — PRD §6/§7)
```
src/modules/<módulo>/
  domain/          regras puras: SEM Prisma, Next ou Stripe. Testável com Vitest.
  application/     casos de uso + ports (interfaces)
  infrastructure/  implementações (Prisma, Stripe, web-push)
  presentation/    Server Actions e schemas Zod
src/composition-root.ts   liga casos de uso às implementações
src/shared/               database, security, errors, utils
```
Módulos: identity, tenants, billing, catalog, professionals, scheduling, appointments, customers, notifications.

## Regras que não podem ser quebradas
1. **Tenant vem da sessão** (`requireOwner()`), nunca do corpo/URL em operações administrativas. Na página pública, vem do slug.
2. **Toda query filtra por `tenantId`.** Relações usam FK composta `(tenantId, id)`.
3. **Sobreposição de agendamento** é barrada no banco (`Appointment_no_overlap`, EXCLUDE USING gist). Erro `23P01` → `SlotUnavailableError`.
4. **Horários em UTC** no banco; regras locais usam `Tenant.timezone` (ver `scheduling/domain/availability.ts`).
5. **Dinheiro em centavos** (`priceCents`), e o agendamento guarda snapshot de preço/nome/duração.
6. **Stripe só muda estado via webhook verificado e idempotente** (`StripeEvent`). O retorno do Checkout não libera nada.
7. **Notificação nunca derruba agendamento**: grave `OutboxEvent` na mesma transação; o envio é feito por `/api/jobs/process-outbox`.
8. **Token de cancelamento**: só o hash (sha256) vai ao banco.
9. Serviços/profissionais com histórico são **desativados**, não excluídos.
10. Com `cacheComponents`, leitura de sessão/cookies fica dentro de `<Suspense>`.

## UI
- Mobile-first (390px). Tema escuro padrão (`data-theme="dark"`), claro disponível (`data-theme="light"`).
- Cores pelos utilitários de token: `bg-canvas bg-surface bg-raised bg-muted text-fg text-fg-muted text-fg-accent bg-accent text-on-accent border-line` etc. Não use hex solto.
- Tipografia: `text-display-lg|md|sm` (Playfair) e `text-title-*`, `text-body-*`, `text-label-*`, `text-overline` (Manrope).
- Componentes base em `src/components/ui` espelham o Figma (Button, Badge, Input…).

## Decisões em aberto (ver docs/decisions.md)
Preços dos planos, política de cancelamento padrão, lembretes por WhatsApp, limites por plano.

## Agent skills

### Issue tracker

Issues e specs ficam como arquivos markdown em `.scratch/<feature>/` neste repo. See `docs/agents/issue-tracker.md`.

### Triage labels

Rótulos padrão: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: um `CONTEXT.md` + `docs/adr/` na raiz (decisões anteriores em `docs/decisions.md`). See `docs/agents/domain.md`.
