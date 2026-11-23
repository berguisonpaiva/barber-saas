### PRD — SaaS Multitenant de Agendamento para Barbearias

MVP definido

Versão 1.0 · 20/11/2026

### 1\. Visão geral do produto

Desenvolver uma plataforma SaaS multitenant para barbearias, permitindo que cada estabelecimento contrate uma assinatura pelo Stripe, configure seus serviços e horários de atendimento e disponibilize um link público para seus clientes realizarem agendamentos.

O sistema será desenvolvido como um monólito modular em Next.js, utilizando Prisma ORM, PostgreSQL e PWA.

### Premissas aprovadas

* Sem Super Admin: não haverá painel global de administração das barbearias.

* Um proprietário por tenant: somente o proprietário acessa o painel administrativo.

* Profissionais sem login: os barbeiros são cadastrados e gerenciados pelo proprietário.

* Assinatura Stripe: cada barbearia contrata e administra sua própria assinatura.

* Agendamento público: o cliente acessa o link divulgado no Instagram, WhatsApp ou outras redes.

* Cliente sem cadastro obrigatório: informa nome e telefone para concluir o agendamento.

* Notificações Web Push: somente o proprietário recebe notificações de novos agendamentos e alterações.

* PWA instalável: o proprietário poderá instalar a aplicação no celular.

* Isolamento multitenant: os dados de cada barbearia serão isolados logicamente.

### 2\. Perfis e permissões

| Recurso                     | Proprietário | Cliente          |
| --------------------------- | ------------ | ---------------- |
| Criar conta e assinar plano | Sim          | Não              |
| Cadastrar serviços          | Sim          | Não              |
| Cadastrar barbeiros         | Sim          | Não              |
| Configurar expediente       | Sim          | Não              |
| Visualizar agenda completa  | Sim          | Não              |
| Criar agendamento           | Sim          | Sim              |
| Cancelar agendamento        | Sim          | Com token seguro |
| Consultar horários livres   | Sim          | Sim              |
| Receber notificações push   | Sim          | Não              |
| Gerenciar assinatura        | Sim          | Não              |

O cliente não terá acesso administrativo. O cancelamento público poderá ser feito por um link seguro, conforme a política de cancelamento definida no MVP.

### 3\. Jornadas do usuário

Jornada da barbearia

* Realiza cadastro e cria sua barbearia.

* Seleciona um plano e é direcionada ao Stripe Checkout.

* Após confirmação da assinatura, acessa o painel.

* Cadastra serviços, preços, duração e profissionais.

* Configura expediente, intervalos, folgas e horários disponíveis.

* Compartilha o link exclusivo de agendamento.

* Instala o PWA e ativa as notificações.

* Recebe novos agendamentos e acompanha a agenda.

Jornada do cliente

* Acessa o link público da barbearia.

* Seleciona serviço e profissional.

* Escolhe uma data e um horário disponível.

* Informa nome e WhatsApp.

* Confirma a reserva e visualiza o comprovante do agendamento.

### 4\. Requisitos funcionais

| Código | Requisito                                 | Prioridade |
| ------ | ----------------------------------------- | ---------- |
| RF-01  | Cadastro e autenticação do proprietário   | P0         |
| RF-02  | Criação e configuração do tenant          | P0         |
| RF-03  | Assinatura recorrente pelo Stripe         | P0         |
| RF-04  | Cadastro e edição de serviços             | P0         |
| RF-05  | Cadastro de profissionais sem login       | P0         |
| RF-06  | Configuração de horários por profissional | P0         |
| RF-07  | Configuração de folgas e bloqueios        | P0         |
| RF-08  | Página pública personalizada por slug     | P0         |
| RF-09  | Cálculo de horários disponíveis           | P0         |
| RF-10  | Criação de agendamento público            | P0         |
| RF-11  | Agenda administrativa diária e semanal    | P0         |
| RF-12  | Cancelamento de agendamento               | P0         |
| RF-13  | Notificações push para o proprietário     | P0         |
| RF-14  | Instalação do PWA                         | P0         |
| RF-15  | Dashboard com indicadores básicos         | P1         |
| RF-16  | Histórico de clientes                     | P1         |
| RF-17  | Reagendamento pelo cliente                | P2         |
| RF-18  | Pagamento antecipado pelo cliente         | P2         |

P0 significa obrigatório para o lançamento; P1 representa melhorias importantes; P2 fica para evolução posterior.

### 5\. Regras de negócio

### RN-01 — Isolamento multitenant

Cada barbearia terá um identificador único (`tenantId`). Toda entidade operacional deve pertencer a um tenant.

O backend nunca deverá confiar em um `tenantId` enviado livremente pelo navegador para operações administrativas. O tenant será resolvido pela sessão autenticada.

Na página pública, o tenant será identificado pelo slug, e as consultas deverão permanecer restritas àquela barbearia.

### RN-02 — Assinatura Stripe

A assinatura será a condição para disponibilizar o serviço de agendamento público.

Estados principais:

| Estado   | Comportamento                                              |
| -------- | ---------------------------------------------------------- |
| TRIALING | Acesso permitido durante o período de teste, se habilitado |
| ACTIVE   | Painel e agendamentos liberados                            |
| PAST_DUE | Aplicar política de tolerância configurada                 |
| CANCELED | Bloquear novas reservas após o término do acesso pago      |
| UNPAID   | Bloquear novas reservas                                    |

O estado local será sincronizado por webhooks verificados do Stripe. O retorno do Checkout, isoladamente, não confirma o pagamento.

### RN-03 — Serviços

Cada serviço terá nome, descrição opcional, preço, duração em minutos e status ativo/inativo.

O proprietário poderá associar serviços aos profissionais que os executam.

### RN-04 — Disponibilidade

A disponibilidade será calculada considerando:

* Horário de funcionamento de cada profissional.

* Duração do serviço.

* Intervalos de descanso.

* Folgas e bloqueios.

* Agendamentos existentes.

* Antecedência mínima para reserva.

* Limite de dias futuros disponíveis.

* Fuso horário da barbearia.

### RN-05 — Conflitos de agendamento

Um profissional não poderá possuir dois agendamentos ativos com horários sobrepostos.

Essa regra será garantida no banco de dados, além da validação na aplicação, para evitar reservas duplicadas durante requisições concorrentes.

### RN-06 — Status de agendamento

CONFIRMED

Reserva confirmada

COMPLETED

Atendido

CANCELED

Cancelado

NO_SHOW

Não compareceu

No MVP, a reserva será confirmada automaticamente após validação da disponibilidade. Não haverá aprovação manual obrigatória.

### RN-07 — Notificações

Ao confirmar ou cancelar um agendamento, o sistema deverá registrar um evento de notificação.

Somente as inscrições Web Push vinculadas ao proprietário do tenant receberão mensagens.

O agendamento não poderá falhar apenas porque a notificação não foi entregue.

### RN-08 — Cancelamento público

O cliente poderá cancelar sua própria reserva usando um token aleatório, com validade e escopo restritos ao agendamento.

O token será armazenado como hash e não poderá ser utilizado para consultar dados de outros clientes.

### RN-09 — Exclusão e histórico

Serviços e profissionais vinculados a agendamentos históricos não serão removidos fisicamente por operações comuns. Serão desativados, preservando a integridade dos registros.

### RN-10 — Proteção contra abuso

As rotas públicas terão rate limiting, validação de entradas e proteção contra criação automatizada de reservas.

### 6\. Arquitetura técnica

A aplicação será um monólito modular, com um único deploy Next.js. Não haverá uma API NestJS separada.

Next.js — App Router + PWA

Painel da barbearia · Página pública · Autenticação

Server Actions / Route Handlers

Validação, sessão, autorização e entrada HTTP

Application — Casos de uso

CreateAppointment

GetAvailableSlots

ManageServices

ManageSubscription

Domain

Entidades · Value Objects · Regras · Contratos

Infrastructure

Prisma · PostgreSQL · Stripe · Web Push

### Stack definitiva

| Tecnologia           | Responsabilidade       |
| -------------------- | ---------------------- |
| Next.js + TypeScript | Frontend e backend     |
| React                | Interface              |
| Prisma ORM           | Persistência           |
| PostgreSQL           | Banco relacional       |
| Auth.js              | Autenticação           |
| Zod                  | Validação de entrada   |
| Tailwind + shadcn/ui | Interface mobile-first |
| Stripe Billing       | Assinaturas            |
| Web Push + VAPID     | Notificações           |
| Service Worker       | PWA e cache            |
| Vitest               | Testes unitários       |
| Playwright           | Testes end-to-end      |
| Docker + Coolify     | Deploy                 |

Para tarefas assíncronas, começaremos com uma tabela de eventos pendentes (outbox) no PostgreSQL e um processador executado por agendamento. Assim, não será necessário introduzir Redis no MVP.

### 7\. Estrutura de diretórios

```text
barber-saas/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── public/
│   ├── icons/
│   ├── manifest.webmanifest
│   └── sw.js
│
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── cadastro/
│   │   │
│   │   ├── (dashboard)/
│   │   │   └── painel/
│   │   │       ├── agenda/
│   │   │       ├── servicos/
│   │   │       ├── profissionais/
│   │   │       ├── horarios/
│   │   │       ├── clientes/
│   │   │       ├── assinatura/
│   │   │       └── configuracoes/
│   │   │
│   │   ├── (booking)/
│   │   │   └── [slug]/
│   │   │       ├── page.tsx
│   │   │       └── agendar/
│   │   │
│   │   └── api/
│   │       ├── auth/
│   │       ├── stripe/webhook/
│   │       ├── push/
│   │       └── jobs/
│   │
│   ├── modules/
│   │   ├── identity/
│   │   ├── tenants/
│   │   ├── billing/
│   │   ├── catalog/
│   │   ├── professionals/
│   │   ├── scheduling/
│   │   ├── appointments/
│   │   ├── customers/
│   │   └── notifications/
│   │
│   ├── shared/
│   │   ├── database/
│   │   ├── security/
│   │   ├── errors/
│   │   └── utils/
│   │
│   └── components/
│
├── tests/
│   ├── integration/
│   └── e2e/
│
├── Dockerfile
├── docker-compose.yml
└── package.json
```

Dentro de cada módulo, seguiremos a estrutura:

```text
appointments/
├── domain/
│   ├── entities/
│   ├── value-objects/
│   ├── repositories/
│   └── errors/
│
├── application/
│   ├── use-cases/
│   └── ports/
│
├── infrastructure/
│   └── prisma/
│
└── presentation/
    ├── actions/
    └── schemas/
```

Regra arquitetural: o domínio não importa Prisma, Next.js ou Stripe. Os casos de uso dependem de interfaces, e a infraestrutura implementa essas interfaces.

### 8\. Modelo de dados multitenant

Relacionamentos principais

Diagrama conceitual simplificado. As relações reais incluem chaves estrangeiras e tabelas associativas.

### Entidades e campos

| Entidade              | Campos principais                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------- |
| Tenant                | id, name, slug, timezone, status                                                             |
| Owner                 | id, tenantId, name, email, passwordHash                                                      |
| Subscription          | tenantId, stripeCustomerId, stripeSubscriptionId, status, currentPeriodEnd                   |
| Service               | id, tenantId, name, price, durationMinutes, active                                           |
| Professional          | id, tenantId, name, active                                                                   |
| ProfessionalService   | tenantId, professionalId, serviceId                                                          |
| AvailabilityRule      | tenantId, professionalId, weekday, startTime, endTime                                        |
| AvailabilityException | tenantId, professionalId, date, startTime, endTime, type                                     |
| Customer              | id, tenantId, name, phone                                                                    |
| Appointment           | id, tenantId, professionalId, serviceId, customerId, startsAt, endsAt, status, priceSnapshot |
| PushSubscription      | id, tenantId, ownerId, endpoint, keys, enabled                                               |
| OutboxEvent           | id, tenantId, type, payload, status, attempts                                                |

A tabela `ProfessionalService` define quais serviços cada barbeiro pode executar.

O `priceSnapshot` preserva o preço praticado no momento do agendamento, mesmo que o proprietário altere o preço posteriormente.

### Exemplo de modelagem Prisma

```prisma
model Tenant {
  id        String   @id @default(uuid())
  name      String
  slug      String   @unique
  timezone  String   @default("America/Fortaleza")
  active    Boolean  @default(true)

  services      Service[]
  professionals Professional[]
  appointments  Appointment[]
}

model Service {
  id              String   @id @default(uuid())
  tenantId        String
  name            String
  price           Decimal  @db.Decimal(10, 2)
  durationMinutes Int
  active          Boolean  @default(true)

  tenant       Tenant        @relation(fields: [tenantId], references: [id])
  appointments Appointment[]

  @@unique([tenantId, id])
  @@index([tenantId, active])
}

model Professional {
  id       String  @id @default(uuid())
  tenantId String
  name     String
  active   Boolean @default(true)

  tenant       Tenant        @relation(fields: [tenantId], references: [id])
  appointments Appointment[]

  @@unique([tenantId, id])
}

enum AppointmentStatus {
  CONFIRMED
  COMPLETED
  CANCELED
  NO_SHOW
}

model Appointment {
  id             String            @id @default(uuid())
  tenantId       String
  professionalId String
  serviceId      String
  customerId     String
  startsAt       DateTime
  endsAt         DateTime
  priceSnapshot  Decimal           @db.Decimal(10, 2)
  status         AppointmentStatus @default(CONFIRMED)

  tenant       Tenant       @relation(fields: [tenantId], references: [id])
  professional Professional @relation(fields: [professionalId], references: [id])
  service      Service      @relation(fields: [serviceId], references: [id])

  @@index([tenantId, professionalId, startsAt])
  @@index([tenantId, startsAt])
}
```

Esse trecho é um recorte ilustrativo, não o schema completo. As demais entidades e relações serão incluídas nas migrações.

Importante: usaremos chaves estrangeiras compostas envolvendo `tenantId` nos relacionamentos operacionais para impedir referências cruzadas entre tenants. Também aplicaremos uma constraint de exclusão no PostgreSQL para evitar sobreposição de reservas.

### 9\. Motor de disponibilidade

O cálculo de horários será um componente central do domínio.

Exemplo: um barbeiro atende das 09h às 12h, com intervalo de 30 minutos entre 10h30 e 11h.

Agenda ilustrativa — Serviço de 30 minutos

09:00

Livre

09:30

Ocupado

10:00

Livre

10:30

Intervalo

11:00

Livre

11:30

Livre

O algoritmo deverá:

* Carregar o expediente do profissional para a data.

* Aplicar exceções, folgas e intervalos.

* Consultar agendamentos ativos.

* Gerar horários candidatos conforme o intervalo de início configurado.

* Verificar se a duração completa do serviço cabe no horário disponível.

* Remover horários passados e os que violam a antecedência mínima.

* Retornar os horários livres ordenados.

Todos os horários serão armazenados em UTC, com conversão para o fuso horário da barbearia na apresentação e no cálculo das regras locais.

### 10\. Contratos e operações da aplicação

Usaremos Server Actions para as operações administrativas e Route Handlers para integrações, consultas públicas e webhooks.

| Operação                 | Entrada                                  | Resultado               |
| ------------------------ | ---------------------------------------- | ----------------------- |
| CreateTenant             | Dados do proprietário e barbearia        | Tenant criado           |
| CreateCheckoutSession    | Plano escolhido                          | URL do Stripe Checkout  |
| CreateService            | Nome, preço e duração                    | Serviço cadastrado      |
| CreateProfessional       | Dados do barbeiro                        | Profissional cadastrado |
| ConfigureAvailability    | Dias, horários e intervalos              | Agenda configurada      |
| GetAvailableSlots        | Slug, serviço, profissional e data       | Horários livres         |
| CreateAppointment        | Serviço, profissional, horário e cliente | Reserva confirmada      |
| CancelAppointment        | Identificador e autorização              | Reserva cancelada       |
| RegisterPushSubscription | Inscrição Web Push                       | Dispositivo registrado  |

### Endpoints públicos e integrações

```text
GET  /api/public/[slug]/services
GET  /api/public/[slug]/professionals
GET  /api/public/[slug]/availability
POST /api/public/[slug]/appointments

POST /api/stripe/webhook

POST   /api/push/subscribe
DELETE /api/push/subscribe

POST /api/jobs/process-outbox
```

As operações administrativas utilizarão Server Actions autenticadas, com validação de sessão, tenant e permissão em cada caso de uso.

### 11\. Estratégia de notificações PWA

O proprietário poderá instalar o PWA no Android ou iPhone e autorizar notificações.

Exemplos de notificações

Novo agendamento

Carlos agendou Corte + Barba para hoje às 15h30.

Barbearia do João · Agora

Agendamento cancelado

O horário das 16h foi liberado após cancelamento.

Barbearia do João · Agora

### Implementação

* Service Worker para receber eventos push.

* Web Push com chaves VAPID.

* Inscrições vinculadas ao proprietário e ao tenant.

* Suporte a vários dispositivos do mesmo proprietário.

* Registro de eventos em outbox para envio confiável.

* Remoção de inscrições expiradas ou inválidas.

* Ao tocar na notificação, abertura do agendamento correspondente no PWA.

A inscrição Web Push será criada apenas após autenticação e consentimento explícito. No iOS, o usuário precisará adicionar o PWA à Tela de Início para receber Web Push.

As notificações não serão o único registro dos agendamentos: o painel sempre exibirá a agenda atualizada, mesmo que uma mensagem push não seja entregue.

### 12\. Segurança e requisitos não funcionais

| Área            | Requisito                                        |
| --------------- | ------------------------------------------------ |
| Multitenancy    | Isolamento por tenant e chaves compostas         |
| Autenticação    | Sessões seguras e senhas com hash                |
| Autorização     | Somente proprietário acessa o painel             |
| Stripe          | Webhook assinado e processamento idempotente     |
| Agendamento     | Proteção contra concorrência no banco            |
| Dados pessoais  | Minimização e tratamento conforme LGPD           |
| API pública     | Rate limiting e validação de entradas            |
| Banco de dados  | Backup automático e recuperação testada          |
| Observabilidade | Logs estruturados e identificação de requisições |
| Performance     | Consultas indexadas e páginas mobile-first       |
| PWA             | HTTPS, manifest e Service Worker                 |

Para evitar vazamentos entre barbearias, os testes de integração devem verificar explicitamente que o proprietário do tenant A não consegue consultar ou alterar dados do tenant B.

### 13\. Planejamento do MVP

Roadmap sugerido

8 semanas

1

Fundação e autenticação

Next.js, Prisma, PostgreSQL, 