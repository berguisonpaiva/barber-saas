# API e operações

Operações administrativas usam **Server Actions** autenticadas; integrações e o fluxo público usam **Route Handlers** (PRD §10).
Erros seguem o formato `{ "error": { "code": "…", "message": "…" } }`.

## Rotas públicas (página da barbearia)

| Método | Rota | Entrada | Saída | Proteções |
|---|---|---|---|---|
| GET | `/api/public/:slug/services` | — | `{ tenant: { name, bookingEnabled }, services[] }` | — |
| GET | `/api/public/:slug/professionals` | `?serviceId=` (opcional) | `{ professionals[] }` | — |
| GET | `/api/public/:slug/availability` | `?serviceId&professionalId&date=AAAA-MM-DD` | `{ date, timeZone, bookingEnabled, slots: ISO[] }` | rate limit 120/min por IP |
| POST | `/api/public/:slug/appointments` | `{ serviceId, professionalId, startsAt (ISO c/ offset), customer: { name, phone }, consent: true, website: "" }` | 201 `{ appointmentId, startsAt, endsAt, cancelUrl }` | rate limit 5/10 min, honeypot `website`, assinatura ativa |
| POST | `/api/public/:slug/appointments/cancel` | `{ token }` | `{ appointmentId }` | rate limit 10/10 min, token com hash e validade |

Códigos de erro: `VALIDATION_ERROR` 422 · `NOT_FOUND` 404 · `SLOT_UNAVAILABLE` 409 · `BOOKING_DISABLED` 403 · `INVALID_CANCEL_TOKEN` 404 · `CANCELLATION_WINDOW_CLOSED` 409 · `RATE_LIMITED` 429 (com `Retry-After`).

## Integrações

| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| GET/POST | `/api/auth/[...nextauth]` | — | Auth.js |
| POST | `/api/stripe/webhook` | Assinatura `stripe-signature` | Sincroniza assinatura (idempotente) |
| POST | `/api/push/subscribe` | Sessão do dono | Registra aparelho (`{ endpoint, keys: { p256dh, auth } }`) |
| DELETE | `/api/push/subscribe` | Sessão do dono | Remove aparelho (`{ endpoint }`) |
| POST | `/api/jobs/process-outbox` | `Authorization: Bearer $CRON_SECRET` | Envia notificações pendentes |

## Server Actions

| Action | Arquivo | Caso de uso |
|---|---|---|
| `loginAction` | `modules/identity/presentation/actions/auth-actions.ts` | Login (Credentials) |
| `registerAction` | idem | CreateTenant + Owner (RF-01/02) |
| `logoutAction` | idem | Sair |
| `startCheckoutAction` | `modules/billing/presentation/actions/checkout-action.ts` | CreateCheckoutSession (RF-03) |
| `createServiceAction` | `modules/catalog/presentation/actions/service-actions.ts` | CreateService (RF-04) |

Padrão de toda action administrativa: `requireOwner()` → validação Zod → caso de uso com o `tenantId` da sessão → `revalidatePath`.

## Mapa PRD × código

| Operação (PRD §10) | Implementação | Status |
|---|---|---|
| CreateTenant | `registerOwner` | ✅ |
| CreateCheckoutSession | `createCheckoutSession` | ✅ |
| CreateService | `createService` | ✅ (falta tela) |
| CreateProfessional | — | ⏳ |
| ConfigureAvailability | — | ⏳ |
| GetAvailableSlots | `GetAvailableSlots` | ✅ |
| CreateAppointment | `CreateAppointment` | ✅ |
| CancelAppointment | `CancelAppointmentByToken` (cliente) | ✅ cliente · ⏳ dono |
| RegisterPushSubscription | `registerPushSubscription` | ✅ |
