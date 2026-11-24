# Banco de dados

PostgreSQL 17 · Prisma 7.10 · schema em [`prisma/schema.prisma`](../prisma/schema.prisma).

## Convenções
- IDs `uuid`. Datas `timestamptz(3)` em **UTC**.
- Dinheiro em **centavos** (`Int`).
- Toda tabela operacional tem `tenantId`; relações operacionais usam **FK composta** `(tenantId, id)`.
- Serviços e profissionais com histórico são desativados (`active = false`), não excluídos (FK `Restrict` em Appointment).

## Entidades

| Modelo | Campos principais | Observações |
|---|---|---|
| Tenant | name, slug (único), timezone, status, address, regras (`slotIntervalMinutes` 30, `minAdvanceMinutes` 120, `maxAdvanceDays` 30, `cancellationWindowMinutes` 120) | status: ONBOARDING · ACTIVE · SUSPENDED |
| Owner | tenantId (único), name, email (único), passwordHash | Um proprietário por tenant |
| Subscription | tenantId (único), stripeCustomerId, stripeSubscriptionId, stripePriceId, status, currentPeriodEnd, trialEndsAt, cancelAtPeriodEnd | Espelho do Stripe |
| StripeEvent | id (evt_…), type, processedAt | Idempotência do webhook |
| Service | name, description, priceCents, durationMinutes, active, sortOrder | |
| Professional | name, active | Sem login |
| ProfessionalService | (tenantId, professionalId, serviceId) | Quem executa o quê |
| AvailabilityRule | professionalId, weekday 0–6, startMinute, endMinute | Minutos desde 00:00 local; intervalo = duas regras |
| AvailabilityException | professionalId, date, startMinute?, endMinute?, type, reason | Sem horários = dia inteiro. type: DAY_OFF · BLOCK |
| Customer | name, phone (E.164) | Único por (tenantId, phone) |
| Appointment | professionalId, customerId, startsAt, endsAt, status, source, priceSnapshotCents, serviceNameSnapshot, durationSnapshotMinute, cancelTokenHash, cancelTokenExpiresAt, canceledAt, canceledBy | status: CONFIRMED · COMPLETED · CANCELED · NO_SHOW. Snapshots = combinação dos serviços ("Corte + Barba", soma de preço e duração) |
| AppointmentService | (tenantId, appointmentId, serviceId), position, serviceNameSnapshot, priceSnapshotCents, durationSnapshotMinute | Serviços de cada agendamento, na ordem escolhida (ADR 0001) |
| PushSubscription | ownerId, endpoint (único), p256dh, auth, enabled, failureCount, lastSuccessAt | |
| OutboxEvent | type, payload (json), status, attempts, availableAt, lastError | PENDING · PROCESSING · DONE · FAILED |
| RateLimitBucket | key, count, resetAt | Rate limit sem Redis |

## Constraints adicionadas à migração `init`
O Prisma não expressa estas regras no schema; elas estão no fim de `prisma/migrations/20261124000000_init/migration.sql` (copiadas de `prisma/custom-constraints.sql` por `scripts/append-db-constraints.mjs`):

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_time_range_check" CHECK ("endsAt" > "startsAt");

-- RN-05: sem sobreposição para o mesmo profissional enquanto CONFIRMED
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_no_overlap"
  EXCLUDE USING gist ("tenantId" WITH =, "professionalId" WITH =,
                      tstzrange("startsAt", "endsAt", '[)') WITH &&)
  WHERE ("status" = 'CONFIRMED');

ALTER TABLE "Service" ADD CONSTRAINT "Service_values_check"
  CHECK ("priceCents" >= 0 AND "durationMinutes" > 0);

ALTER TABLE "AvailabilityRule" ADD CONSTRAINT "AvailabilityRule_range_check"
  CHECK ("weekday" BETWEEN 0 AND 6 AND "startMinute" >= 0 AND "endMinute" <= 1440 AND "endMinute" > "startMinute");
```
Violação da EXCLUDE retorna SQLSTATE `23P01`, convertida em `SlotUnavailableError` (HTTP 409).

A migração `20261124190000_appointment_services` acrescenta, também por SQL (e em `prisma/custom-constraints.sql`, usado pelo banco de teste):

```sql
ALTER TABLE "AppointmentService" ADD CONSTRAINT "AppointmentService_values_check"
  CHECK ("position" >= 0 AND "priceSnapshotCents" >= 0 AND "durationSnapshotMinute" > 0);
```

## Comandos
| Comando | Uso |
|---|---|
| `npm run db:up` | Postgres local (Docker) |
| `npm run db:init` | Primeira vez: aplica as migrações versionadas (`prisma migrate deploy`) |
| `npm run db:migrate` | Novas migrações após alterar o schema |
| `npm run db:seed` | Dados demo (joao@demo.com / barber123) |
| `npm run db:studio` | Prisma Studio |
| `npm test` com `DATABASE_URL_TEST` | Testes de integração; o banco precisa terminar em `_test` (o schema é recriado a cada execução) |
| `npm run db:deploy` | Produção (`prisma migrate deploy`) |
