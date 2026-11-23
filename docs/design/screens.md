# Telas e fluxos do protótipo

Arquivo: https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy (página **📱 Telas — Protótipo**).
Formato: iPhone 390 × 844, tema Dark. Para navegar, abra o modo apresentação e escolha um dos fluxos iniciais.

## Fluxos iniciais (flow starting points)
1. **Cliente — agendar pelo link** → C1
2. **Proprietário — cadastro e assinatura** → O1
3. **Painel — notificação de novo agendamento** → P0
4. **Painel — agenda e gestão** → P1

## 1 · Cliente (web mobile, sem login)

| Tela | Figma | Conteúdo | Requisitos | Rota no código |
|---|---|---|---|---|
| C1 · Página da barbearia | [16:11](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=16-11) | Hero com foto, endereço, "Aberto agora", lista de serviços, CTA com total | RF-08 | `/[slug]` ✅ (sem fluxo) |
| C2 · Escolher profissional | [16:144](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=16-144) | Stepper 2/4, resumo do serviço, profissionais com próximo horário | RF-09 | ⏳ |
| C3 · Data e horário | [16:228](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=16-228) | Faixa de datas, horários manhã/tarde, aviso de fuso, resumo no rodapé | RF-09, RN-04 | ⏳ (API pronta) |
| C4 · Seus dados | [16:330](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=16-330) | Nome, WhatsApp (+55), consentimento LGPD, total | RF-10 | ⏳ (API pronta) |
| C5 · Comprovante | [17:213](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=17-213) | Confirmação, detalhes, código da reserva, adicionar ao calendário, cancelar | RF-10, RN-06 | ⏳ |
| C6 · Cancelar (link seguro) | [17:289](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=17-289) | Dados do agendamento, política de cancelamento, confirmar/manter | RF-12, RN-08 | `/[slug]/cancelar` (stub) |
| C7 · Cancelamento concluído | [17:373](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=17-373) | Confirmação e "Agendar novo horário" | RF-12 | ⏳ |

## 2 · Proprietário — onboarding

| Tela | Figma | Conteúdo | Requisitos | Rota |
|---|---|---|---|---|
| O1 · Login | [17:391](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=17-391) | E-mail, senha, esqueci a senha, criar barbearia | RF-01 | `/login` ✅ |
| O2 · Criar conta e barbearia | [18:326](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=18-326) | Dados do dono + nome e link (slug) da barbearia | RF-01, RF-02 | `/cadastro` ✅ |
| O3 · Escolher plano | [18:394](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=18-394) | Plano Pro (destaque) e Solo, "Assinar com Stripe" | RF-03 | `/painel/assinatura` ✅ |
| O4 · Confirmando assinatura | [18:458](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=18-458) | Aguardando webhook: checkout → pagamento → painel | RN-02 | `/painel/assinatura/confirmando` (stub) |
| O5 · Primeiros passos | [18:492](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=18-492) | Checklist de configuração (6 passos) | — | ⏳ |
| O6 · Ativar notificações | [18:614](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=18-614) | Prévia da notificação, dica do iPhone | RF-13, RF-14 | `PushManager` em `/painel/mais` ✅ |

## 3 · Proprietário — painel PWA

| Tela | Figma | Conteúdo | Requisitos | Rota |
|---|---|---|---|---|
| P0 · Notificação push | [19:503](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=19-503) | Tela bloqueada com push de novo agendamento e cancelamento | RF-13, RN-07 | `public/sw.js` ✅ |
| P1 · Agenda do dia | [19:539](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=19-539) | Dia/Semana, filtro por profissional, indicadores, lista, botão + | RF-11 | `/painel/agenda` ✅ (lista) |
| P2 · Detalhe do agendamento | [19:736](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=19-736) | Cliente, WhatsApp/ligar, detalhes, atendido/faltou/cancelar | RN-06 | ⏳ |
| P3 · Serviços | [19:855](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=19-855) | Lista com ativar/desativar | RF-04, RN-09 | `/painel/servicos` (stub) |
| P4 · Novo serviço | [20:766](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=20-766) | Nome, preço, duração, quem realiza, disponível online | RF-04, RN-03 | action pronta ⏳ tela |
| P5 · Equipe | [20:860](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=20-860) | Profissionais (sem login) | RF-05 | `/painel/equipe` (stub) |
| P6 · Horários do profissional | [20:959](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=20-959) | Expediente semanal com intervalos | RF-06 | ⏳ |
| P7 · Folgas e bloqueios | [21:873](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=21-873) | Exceções por data | RF-07 | ⏳ |
| P8 · Mais | [21:967](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=21-967) | Link público, assinatura, notificações, regras, sair | — | `/painel/mais` (parcial) |
| P9 · Assinatura | [21:1127](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=21-1127) | Plano, status, próxima cobrança, aviso de pagamento pendente, portal Stripe | RN-02 | ⏳ |
| P1 · Agenda (Light) | [21:1184](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=21-1184) | Demonstração do tema claro | — | `data-theme="light"` |

## Interações do protótipo
- C1 → C2 → C3 → C4 → C5 pelos botões "Continuar"; C5 "Cancelar agendamento" → C6 → C7; C7 "Agendar novo horário" → C1.
- O1 "Entrar" → P1; "Criar minha barbearia" → O2 → O3 → O4 → O5 → O6 → P1.
- P0 (toque na notificação) → P2; P1 (toque no agendamento das 15:30) → P2.
- BottomNav: Agenda (P1) · Serviços (P3) · Equipe (P5) · Mais (P8).
- P3 "+" → P4; P5 "Rafael" → P6; P6 ↔ P7 pelo segmented; P8 "Assinatura" → P9.
- Botões "voltar" das AppBars usam a ação *Back*.

## Dados de exemplo (iguais no seed)
Barbearia do João · Rua das Flores, 120 · Aldeota, Fortaleza · fuso America/Fortaleza.
Serviços: Corte masculino 30 min R$ 45 · Barba 30 min R$ 35 · Corte + Barba 60 min R$ 70 · Pezinho 15 min R$ 15.
Profissionais: Rafael Lima, Diego Alves, Marcos Souza.
