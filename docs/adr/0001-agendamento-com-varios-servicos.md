# Agendamento com vários serviços

O cliente escolhe um ou mais serviços (até 5) para o mesmo horário com um profissional — por exemplo Corte e Barba — em vez de um Agendamento por serviço.

Os serviços ficam em `AppointmentService` (um por linha, na ordem escolhida, com nome, preço e duração gravados na marcação). O `Appointment` continua guardando o atendimento combinado — nome "Corte + Barba", preço e duração somados — e perdeu a coluna `serviceId`. Assim agenda, notificações, cancelamento e histórico do cliente seguem lendo um nome e um preço só; o Resumo divide o faturamento pelos serviços de cada agendamento.

Regras: só aparecem os profissionais que executam todos os serviços escolhidos; o Horário livre exige que a duração somada caiba; qualquer serviço Desativado entre os escolhidos torna a combinação indisponível. A ordem dos serviços não muda o horário e não há preço de combo automático — desconto continua sendo um serviço próprio ("Corte + Barba") cadastrado pelo proprietário.

## Considered Options

- **Serviço combo cadastrado à mão**: funciona sem código, mas obriga o proprietário a cadastrar cada combinação e não mostra no Resumo quanto cada serviço fatura.
- **Manter `Appointment.serviceId` como "serviço principal"** e acrescentar só os extras: migração menor, mas deixa um campo que mente quando há mais de um serviço.
- **Um Agendamento por serviço, em sequência**: reaproveita tudo, mas o cliente cancela metade, recebe dois links e o proprietário vê dois cartões para um atendimento.

## Consequences

A migração `20261124190000_appointment_services` copia o serviço de cada agendamento existente para `AppointmentService` (posição 0) antes de remover `Appointment.serviceId`; se a cópia falhar, a migração aborta inteira. A API pública passou de `serviceId` para `serviceIds` (lista na URL separada por vírgula; array no corpo do POST).
