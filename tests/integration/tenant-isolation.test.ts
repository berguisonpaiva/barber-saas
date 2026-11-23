import { describe, it } from "vitest";

/**
 * PRD §12: o proprietário do tenant A não pode consultar nem alterar dados do tenant B.
 * Rodar contra um banco de teste: DATABASE_URL_TEST=... npm test
 * TODO: implementar com dois tenants semeados, cobrindo:
 *  - listAgenda(tenantA) não retorna agendamentos de B
 *  - createService(tenantA, { professionalIds: [profDeB] }) falha (FK composta)
 *  - Appointment com professionalId de B e tenantId de A é rejeitado pelo banco
 *  - exclusion constraint: dois CONFIRMED sobrepostos do mesmo profissional → 23P01
 */
describe.skipIf(!process.env.DATABASE_URL_TEST)("isolamento multitenant", () => {
  it.todo("tenant A não lê agenda do tenant B");
  it.todo("FK composta impede referência cruzada entre tenants");
  it.todo("banco rejeita agendamentos sobrepostos (exclusion constraint)");
});
