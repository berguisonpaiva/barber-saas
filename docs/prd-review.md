# Revisão do PRD v1.0

Análise feita junto com o protótipo (20/11/2026). PRD original: [`PRD.md`](PRD.md).

## Pontos fortes
- Monólito modular com camadas claras e domínio isolado.
- Tenant resolvido pela sessão (admin) e pelo slug (público).
- FKs compostas por tenant + exclusion constraint contra reserva duplicada.
- Outbox no Postgres (sem Redis) e notificação que não derruba o agendamento.
- Stripe confirmado só por webhook verificado e idempotente.
- Token de cancelamento guardado como hash; `priceSnapshot` preserva o preço.

## Lacunas e como foram tratadas

| # | Ponto | Situação |
|---|---|---|
| 1 | **Quem usa o PWA**: só o proprietário instala; o cliente usa o link no navegador. | Esclarecido; manifest aponta para `/painel/agenda`. |
| 2 | **Lembrete ao cliente** (WhatsApp/SMS) não existe — maior causa de faltas. | Pendente de decisão. Protótipo tem "Adicionar ao calendário". |
| 3 | **Transições COMPLETED / NO_SHOW**: quem marca e quando. | Botões no detalhe (P2); implementação pendente. |
| 4 | **Regras sem valores**: janela de cancelamento, antecedência, limite de dias, intervalo. | Padrões no `Tenant` (120 min, 120 min, 30 dias, 30 min) e tela "Regras de agendamento" prevista. |
| 5 | **Agendamento criado pelo dono** (permitido na tabela de permissões) sem RF/tela. | FAB "+" na agenda; `source = OWNER_PANEL` no modelo. |
| 6 | **Exclusion constraint** precisa valer só para CONFIRMED e exige SQL manual (Prisma não suporta). | Implementado via `scripts/append-db-constraints.mjs`. |
| 7 | **Exemplo de schema**: `active` vs `status` no Tenant; faltam Customer, token de cancelamento e FKs compostas. | Corrigido no `schema.prisma`. |
| 8 | **Cliente duplicado**: falta regra de unicidade. | `@@unique([tenantId, phone])` + normalização E.164. |
| 9 | **LGPD**: consentimento, retenção e exclusão de dados do cliente. | Consentimento no C4; retenção/exclusão pendentes. |
| 10 | **Planos e preços** não definidos. | Placeholders Pro R$ 49,90 / Solo R$ 29,90. |
| 11 | **Slugs reservados** e troca de slug. | Lista em `tenants/domain/slug.ts`; troca pendente. |
| 12 | **Rate limit sem Redis**. | Tabela `RateLimitBucket` com upsert atômico. |
| 13 | **Roadmap (§13)** está incompleto no documento. | Completar no PRD. |
| 14 | **Dinheiro em Decimal** no exemplo. | Trocado por centavos (`Int`). |
