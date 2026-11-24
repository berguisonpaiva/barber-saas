# A grade de horários anda pela duração do atendimento

Antes, os horários livres avançavam sempre pela Grade de horários da barbearia (ex.: de 30 em 30), qualquer que fosse a duração: um atendimento de 60 min aparecia às 09:00, 09:30, 10:00… O proprietário leu isso como "o tempo dos serviços não está somando" ao escolher Corte + Barba.

Agora o passo é a duração do atendimento arredondada para cima ao múltiplo da grade (`slotStep` em `scheduling/domain/availability.ts`): 60 min em grade de 30 → 09:00, 10:00, 11:00; 45 min → de hora em hora; 15 min → de 30 em 30. Vale para qualquer atendimento, de um serviço ou combinado (ADR 0001), e a contagem continua começando no início de cada período do expediente.

## Considered Options

- **Grade fixa, mostrando o fim de cada horário** ("09:00–10:00, 09:30–10:30"): mantinha mais opções de início, mas foi recusada pelo proprietário.
- **Passo exatamente igual à duração** (45 min → 09:00, 09:45, 10:30): horários quebrados; o arredondamento à grade mantém a agenda em horas redondas.

## Consequences

Atendimentos longos oferecem menos inícios (60 min não começa mais às 09:30). Inverte o teste "a Grade de horários pode ser menor que a duração do serviço"; a Grade passa a ser o passo mínimo.
