# Decisões e pendências

## Tomadas na preparação do código
- **Dinheiro em centavos** (`priceCents Int`) em vez de `Decimal` do PRD: evita erro de arredondamento e simplifica o Stripe.
- **Disponibilidade em minutos do dia** (`startMinute/endMinute`) no fuso da barbearia. Intervalo de almoço = duas janelas.
- **Rate limit no Postgres** (`RateLimitBucket`) para não introduzir Redis no MVP.
- **Constraints customizadas** (EXCLUDE/CHECK) acrescentadas à migração `init` por `scripts/append-db-constraints.mjs`.
- **Status NO_SHOW** exibido como "Faltou" na UI.

## Em aberto (decidir antes do lançamento)
- Preços e limites dos planos (protótipo usa Pro R$ 49,90 e Solo R$ 29,90 como placeholders).
- Janela de cancelamento padrão (hoje 120 min), antecedência mínima (120 min), limite de dias (30), intervalo (30 min).
- Lembrete ao cliente (WhatsApp/SMS) — maior redutor de faltas, fora do PRD.
- Agendamento criado pelo dono (encaixe/telefone) — permitido no PRD, sem tela definida.
- Tolerância de PAST_DUE (hoje 3 dias, `billing/domain/booking-gate.ts`).
