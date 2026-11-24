/** `services` de um agendamento de um serviço só, para testes que gravam o agendamento direto no banco. */
export function oneService(serviceId: string, priceSnapshotCents = 4000, serviceNameSnapshot = "Corte") {
  return {
    create: [{ serviceId, position: 0, serviceNameSnapshot, priceSnapshotCents, durationSnapshotMinute: 30 }],
  };
}
