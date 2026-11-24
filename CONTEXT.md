# Barber SaaS

Plataforma de agendamento para barbearias: cada barbearia assina o serviço, configura serviços e horários dos seus profissionais e divulga um link público onde clientes marcam atendimentos.

## Pessoas e organização

**Barbearia**:
O estabelecimento assinante; tudo o que existe no sistema pertence a exatamente uma barbearia.
_Avoid_: estabelecimento, loja, empresa, cliente (no sentido de quem paga o SaaS)

**Link de agendamento**:
O endereço público da barbearia, que o proprietário divulga e por onde os clientes marcam; é gerado no cadastro a partir do nome da barbearia com um sufixo aleatório, e nunca muda depois de divulgado.
_Avoid_: slug (fora do código), link público, URL da barbearia

**Proprietário**:
A única pessoa com acesso ao painel de uma barbearia; administra tudo e recebe as notificações.
_Avoid_: dono, admin, usuário

**Profissional**:
Pessoa que executa serviços na barbearia; não tem acesso ao sistema.
_Avoid_: barbeiro, funcionário, colaborador

**Cliente**:
Pessoa que marca um agendamento pelo link público, identificada pelo WhatsApp, sem cadastro. Cada agendamento guarda o nome informado naquela marcação; o Cliente fica com o nome mais recente.
_Avoid_: usuário, consumidor

## Catálogo

**Serviço**:
Algo que a barbearia oferece, com preço e duração, executado por um ou mais profissionais.
_Avoid_: produto, procedimento

**Desativado**:
Serviço ou profissional retirado de uso sem ser apagado, para preservar o histórico. Não oferece horários nem aceita novos agendamentos; os agendamentos confirmados que já existiam continuam valendo.
_Avoid_: excluído, removido, inativo

## Horários

**Expediente**:
Os períodos da semana em que um profissional atende.
_Avoid_: horário de funcionamento, jornada, disponibilidade

**Intervalo**:
Pausa de descanso dentro do expediente (ex.: 10h30–11h).
_Avoid_: pausa, almoço (como termo genérico)

**Grade de horários**:
Passo mínimo entre os inícios possíveis (ex.: de 30 em 30 minutos), contando a partir do início de cada período do expediente. Os horários de um atendimento andam pela duração dele arredondada para cima ao múltiplo da grade: 60 min em grade de 30 vai de hora em hora; 15 min fica de 30 em 30. Ver docs/adr/0002-grade-anda-pela-duracao.md.
_Avoid_: intervalo, intervalo de início, passo, slot

**Folga**:
Dia inteiro em que o profissional não atende.
_Avoid_: dia off, ausência

**Bloqueio**:
Trecho de um dia em que o profissional não atende, fora do expediente normal (ex.: consulta médica 14h–16h). Um bloqueio sem trecho definido vale para o dia inteiro.
_Avoid_: exceção, indisponibilidade

**Horário livre**:
Início possível para os serviços escolhidos com um profissional numa data, em que a duração somada cabe sem conflito.
_Avoid_: slot, vaga, horário disponível

**Fuso da barbearia**:
O fuso horário em que a barbearia funciona; todo dia, horário e prazo local (expediente, hoje, limite de dias) é contado nele. Uma data que não existe no calendário não é um dia válido.
_Avoid_: fuso do cliente, horário do servidor

**Antecedência mínima**:
Quanto tempo antes do início um agendamento ainda pode ser marcado.

**Limite de dias**:
Até quantos dias de calendário à frente, no fuso da barbearia, a agenda aceita agendamentos; o último dia aparece inteiro.

## Agendamento

**Agendamento**:
Um cliente marcado com um profissional para um ou mais serviços (até 5), num início e fim definidos; o fim é o início mais a duração somada dos serviços. Ver docs/adr/0001-agendamento-com-varios-servicos.md.
_Avoid_: reserva, marcação, horário (como sinônimo do agendamento)

**Confirmado**:
Agendamento marcado que ainda não foi encerrado como atendido, faltou ou cancelado; é o único estado que ocupa o tempo do profissional.
_Avoid_: ativo, pendente

**Atendido**:
Agendamento em que o cliente foi atendido.
_Avoid_: concluído, finalizado

**Faltou**:
Agendamento em que o cliente não compareceu; libera o tempo restante do profissional.
_Avoid_: no-show, ausente

**Cancelado**:
Agendamento desfeito pelo cliente ou pelo proprietário; libera o horário.

**Janela de cancelamento**:
Até quanto tempo antes do início o cliente ainda pode cancelar sozinho.
_Avoid_: prazo de cancelamento, política

**Link de cancelamento**:
Endereço secreto entregue ao cliente que permite cancelar apenas aquele agendamento, enquanto a janela de cancelamento estiver aberta; depois disso, só informa que é preciso falar com a barbearia. Cancelar de novo um agendamento já cancelado não é erro.
_Avoid_: token (fora do código)

## Assinatura

**Assinatura**:
O contrato pago da barbearia com a plataforma, num plano.
_Avoid_: plano (como sinônimo), mensalidade

**Plano**:
A oferta comercial escolhida na assinatura (ex.: Pro, Solo).

**Agendamento público liberado**:
Condição em que o link público aceita novos agendamentos, determinada pela situação da assinatura.
_Avoid_: barbearia ativa, conta ativa

**Tolerância**:
Prazo após uma cobrança não paga em que o agendamento público continua liberado.
_Avoid_: carência
