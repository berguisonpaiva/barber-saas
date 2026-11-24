import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ConflictError, NotFoundError, ValidationError } from "@/shared/errors/app-error";
import type { PrismaClient } from "@/shared/database/prisma";
import type { Clock } from "@/shared/utils/clock";

const url = process.env.DATABASE_URL_TEST;
const FIXED_NOW = new Date("2030-03-04T12:00:00Z"); // 09:00 em Fortaleza
const clock: Clock = { now: () => FIXED_NOW };

type Modules = {
  createService: typeof import("@/modules/catalog/application/use-cases/create-service").createService;
  updateService: typeof import("@/modules/catalog/application/use-cases/update-service").updateService;
  deleteService: typeof import("@/modules/catalog/application/use-cases/delete-service").deleteService;
  setServiceActive: typeof import("@/modules/catalog/application/use-cases/set-service-active").setServiceActive;
  createProfessional: typeof import("@/modules/professionals/application/use-cases/create-professional").createProfessional;
  deleteProfessional: typeof import("@/modules/professionals/application/use-cases/delete-professional").deleteProfessional;
  replaceWeeklySchedule: typeof import("@/modules/scheduling/application/use-cases/manage-weekly-schedule").replaceWeeklySchedule;
  getWeeklySchedule: typeof import("@/modules/scheduling/application/use-cases/manage-weekly-schedule").getWeeklySchedule;
  exceptions: typeof import("@/modules/scheduling/application/use-cases/manage-availability-exceptions");
  updateCustomer: typeof import("@/modules/customers/application/use-cases/update-customer").updateCustomer;
  listCustomers: typeof import("@/modules/customers/application/use-cases/list-customers").listCustomers;
  getCustomerHistory: typeof import("@/modules/customers/application/use-cases/get-customer-history").getCustomerHistory;
  updateProfessional: typeof import("@/modules/professionals/application/use-cases/update-professional").updateProfessional;
  settings: typeof import("@/modules/tenants/application/use-cases/manage-barbearia-settings");
  getDashboard: typeof import("@/modules/appointments/application/use-cases/get-dashboard").getDashboard;
};

describe.skipIf(!url)("cadastros do proprietário (Postgres)", () => {
  let prisma: PrismaClient;
  let m: Modules;

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    ({ prisma } = await import("@/shared/database/prisma"));
    m = {
      createService: (await import("@/modules/catalog/application/use-cases/create-service")).createService,
      updateService: (await import("@/modules/catalog/application/use-cases/update-service")).updateService,
      deleteService: (await import("@/modules/catalog/application/use-cases/delete-service")).deleteService,
      setServiceActive: (await import("@/modules/catalog/application/use-cases/set-service-active")).setServiceActive,
      createProfessional: (await import("@/modules/professionals/application/use-cases/create-professional")).createProfessional,
      deleteProfessional: (await import("@/modules/professionals/application/use-cases/delete-professional")).deleteProfessional,
      replaceWeeklySchedule: (await import("@/modules/scheduling/application/use-cases/manage-weekly-schedule")).replaceWeeklySchedule,
      getWeeklySchedule: (await import("@/modules/scheduling/application/use-cases/manage-weekly-schedule")).getWeeklySchedule,
      exceptions: await import("@/modules/scheduling/application/use-cases/manage-availability-exceptions"),
      updateCustomer: (await import("@/modules/customers/application/use-cases/update-customer")).updateCustomer,
      listCustomers: (await import("@/modules/customers/application/use-cases/list-customers")).listCustomers,
      getCustomerHistory: (await import("@/modules/customers/application/use-cases/get-customer-history")).getCustomerHistory,
      updateProfessional: (await import("@/modules/professionals/application/use-cases/update-professional")).updateProfessional,
      settings: await import("@/modules/tenants/application/use-cases/manage-barbearia-settings"),
      getDashboard: (await import("@/modules/appointments/application/use-cases/get-dashboard")).getDashboard,
    };
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  const newTenant = () =>
    prisma.tenant.create({ data: { name: "Barbearia Teste", slug: `cad-${randomUUID().slice(0, 8)}` }, select: { id: true } });

  const serviceInput = (professionalIds: string[] = []) => ({
    name: "Corte",
    description: undefined,
    price: 4500,
    durationMinutes: 30,
    professionalIds,
    active: true,
  });

  async function bookOnce(tenantId: string, professionalId: string, serviceId: string, startsAt: Date, status: "CONFIRMED" | "COMPLETED" = "CONFIRMED") {
    const customer = await prisma.customer.create({
      data: { tenantId, name: "Carlos", phone: `+55859${String(Math.floor(Math.random() * 1e8)).padStart(8, "0")}` },
    });
    return prisma.appointment.create({
      data: {
        tenantId,
        professionalId,
        serviceId,
        customerId: customer.id,
        startsAt,
        endsAt: new Date(startsAt.getTime() + 30 * 60_000),
        status,
        priceSnapshotCents: 4500,
        serviceNameSnapshot: "Corte",
        durationSnapshotMinute: 30,
        customerNameSnapshot: "Carlos",
      },
    });
  }

  describe("serviços", () => {
    it("cria o serviço já vinculado aos profissionais escolhidos", async () => {
      const { id: tenantId } = await newTenant();
      const professional = await m.createProfessional(tenantId, { name: "Rafael", serviceIds: [], active: true });

      const service = await m.createService(tenantId, serviceInput([professional.id]));

      const links = await prisma.professionalService.findMany({ where: { tenantId, serviceId: service.id } });
      expect(links.map((l) => l.professionalId)).toEqual([professional.id]);
    });

    it("recusa vincular profissional de outra barbearia", async () => {
      const [a, b] = [await newTenant(), await newTenant()];
      const outsider = await m.createProfessional(b.id, { name: "De fora", serviceIds: [], active: true });

      await expect(m.createService(a.id, serviceInput([outsider.id]))).rejects.toBeInstanceOf(ValidationError);
    });

    it("editar substitui quem realiza o serviço", async () => {
      const { id: tenantId } = await newTenant();
      const rafael = await m.createProfessional(tenantId, { name: "Rafael", serviceIds: [], active: true });
      const diego = await m.createProfessional(tenantId, { name: "Diego", serviceIds: [], active: true });
      const service = await m.createService(tenantId, serviceInput([rafael.id]));

      await m.updateService(tenantId, service.id, { ...serviceInput([diego.id]), name: "Corte degradê", price: 5000 });

      const saved = await prisma.service.findUniqueOrThrow({
        where: { id: service.id },
        include: { professionals: true },
      });
      expect(saved).toMatchObject({ name: "Corte degradê", priceCents: 5000 });
      expect(saved.professionals.map((p) => p.professionalId)).toEqual([diego.id]);
    });

    it("outra barbearia não consegue editar nem desativar o serviço", async () => {
      const [owner, intruder] = [await newTenant(), await newTenant()];
      const service = await m.createService(owner.id, serviceInput());

      await expect(m.updateService(intruder.id, service.id, serviceInput())).rejects.toBeInstanceOf(NotFoundError);
      await expect(m.setServiceActive(intruder.id, service.id, false)).rejects.toBeInstanceOf(NotFoundError);
      expect((await prisma.service.findUniqueOrThrow({ where: { id: service.id } })).active).toBe(true);
    });

    it("exclui serviço sem histórico", async () => {
      const { id: tenantId } = await newTenant();
      const service = await m.createService(tenantId, serviceInput());

      await m.deleteService(tenantId, service.id);

      expect(await prisma.service.count({ where: { id: service.id } })).toBe(0);
    });

    it("serviço com agendamento não é excluído (RN-09)", async () => {
      const { id: tenantId } = await newTenant();
      const professional = await m.createProfessional(tenantId, { name: "Rafael", serviceIds: [], active: true });
      const service = await m.createService(tenantId, serviceInput([professional.id]));
      await bookOnce(tenantId, professional.id, service.id, new Date("2030-03-05T12:00:00Z"));

      await expect(m.deleteService(tenantId, service.id)).rejects.toBeInstanceOf(ConflictError);
      expect(await prisma.service.count({ where: { id: service.id } })).toBe(1);
    });
  });

  describe("profissionais", () => {
    it("profissional com agendamento não é excluído (RN-09)", async () => {
      const { id: tenantId } = await newTenant();
      const service = await m.createService(tenantId, serviceInput());
      const professional = await m.createProfessional(tenantId, { name: "Rafael", serviceIds: [service.id], active: true });
      await bookOnce(tenantId, professional.id, service.id, new Date("2030-03-05T12:00:00Z"));

      await expect(m.deleteProfessional(tenantId, professional.id)).rejects.toBeInstanceOf(ConflictError);
    });

    it("excluir profissional sem histórico leva junto expediente e vínculos", async () => {
      const { id: tenantId } = await newTenant();
      const service = await m.createService(tenantId, serviceInput());
      const professional = await m.createProfessional(tenantId, { name: "Rafael", serviceIds: [service.id], active: true });
      await m.replaceWeeklySchedule(tenantId, professional.id, [{ weekday: 1, startMinute: 540, endMinute: 720 }]);

      await m.deleteProfessional(tenantId, professional.id);

      expect(await prisma.availabilityRule.count({ where: { professionalId: professional.id } })).toBe(0);
      expect(await prisma.professionalService.count({ where: { professionalId: professional.id } })).toBe(0);
    });

    const linkedServices = async (professionalId: string) =>
      (await prisma.professionalService.findMany({ where: { professionalId } })).map((link) => link.serviceId).sort();

    it("editar troca nome, situação e os serviços que ele realiza", async () => {
      const { id: tenantId } = await newTenant();
      const [corte, barba] = [await m.createService(tenantId, serviceInput()), await m.createService(tenantId, serviceInput())];
      const professional = await m.createProfessional(tenantId, { name: "Rafael", serviceIds: [corte.id], active: true });

      await m.updateProfessional(tenantId, professional.id, { name: "Rafael Lima", serviceIds: [barba.id], active: false });

      expect(await prisma.professional.findUniqueOrThrow({ where: { id: professional.id } })).toMatchObject({
        name: "Rafael Lima",
        active: false,
      });
      expect(await linkedServices(professional.id)).toEqual([barba.id]);
    });

    it("editar com serviço de outra barbearia é recusado e nada muda", async () => {
      const [owner, other] = [await newTenant(), await newTenant()];
      const corte = await m.createService(owner.id, serviceInput());
      const foreign = await m.createService(other.id, serviceInput());
      const professional = await m.createProfessional(owner.id, { name: "Rafael", serviceIds: [corte.id], active: true });

      await expect(
        m.updateProfessional(owner.id, professional.id, { name: "Outro", serviceIds: [foreign.id], active: true }),
      ).rejects.toBeInstanceOf(ValidationError);

      expect((await prisma.professional.findUniqueOrThrow({ where: { id: professional.id } })).name).toBe("Rafael");
      expect(await linkedServices(professional.id)).toEqual([corte.id]);
    });

    it("outra barbearia não edita o profissional", async () => {
      const [owner, intruder] = [await newTenant(), await newTenant()];
      const professional = await m.createProfessional(owner.id, { name: "Rafael", serviceIds: [], active: true });

      await expect(
        m.updateProfessional(intruder.id, professional.id, { name: "Invasor", serviceIds: [], active: true }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("expediente", () => {
    it("substitui o expediente inteiro", async () => {
      const { id: tenantId } = await newTenant();
      const professional = await m.createProfessional(tenantId, { name: "Rafael", serviceIds: [], active: true });
      await m.replaceWeeklySchedule(tenantId, professional.id, [{ weekday: 1, startMinute: 540, endMinute: 1080 }]);

      await m.replaceWeeklySchedule(tenantId, professional.id, [
        { weekday: 2, startMinute: 780, endMinute: 1140 },
        { weekday: 2, startMinute: 540, endMinute: 720 },
      ]);

      expect(await m.getWeeklySchedule(tenantId, professional.id)).toEqual([
        { weekday: 2, startMinute: 540, endMinute: 720 },
        { weekday: 2, startMinute: 780, endMinute: 1140 },
      ]);
    });

    it("expediente sobreposto é recusado e o anterior fica intacto", async () => {
      const { id: tenantId } = await newTenant();
      const professional = await m.createProfessional(tenantId, { name: "Rafael", serviceIds: [], active: true });
      await m.replaceWeeklySchedule(tenantId, professional.id, [{ weekday: 1, startMinute: 540, endMinute: 1080 }]);

      await expect(
        m.replaceWeeklySchedule(tenantId, professional.id, [
          { weekday: 3, startMinute: 540, endMinute: 780 },
          { weekday: 3, startMinute: 720, endMinute: 1080 },
        ]),
      ).rejects.toBeInstanceOf(ValidationError);
      expect(await m.getWeeklySchedule(tenantId, professional.id)).toHaveLength(1);
    });

    it("não altera expediente de profissional de outra barbearia", async () => {
      const [owner, intruder] = [await newTenant(), await newTenant()];
      const professional = await m.createProfessional(owner.id, { name: "Rafael", serviceIds: [], active: true });

      await expect(
        m.replaceWeeklySchedule(intruder.id, professional.id, [{ weekday: 1, startMinute: 540, endMinute: 600 }]),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("folgas e bloqueios", () => {
    it("grava a folga na data local e a lista entre as próximas", async () => {
      const { id: tenantId } = await newTenant();
      const professional = await m.createProfessional(tenantId, { name: "Rafael", serviceIds: [], active: true });

      await m.exceptions.createAvailabilityException(
        tenantId,
        professional.id,
        { type: "DAY_OFF", date: "2030-03-06", start: undefined, end: undefined, reason: "Viagem" },
        clock,
      );

      const { today, exceptions } = await m.exceptions.listUpcomingExceptions(tenantId, professional.id, clock);
      expect(today).toBe("2030-03-04");
      expect(exceptions).toEqual([expect.objectContaining({ date: "2030-03-06", type: "DAY_OFF", reason: "Viagem" })]);
    });

    it("outra barbearia não remove a folga", async () => {
      const [owner, intruder] = [await newTenant(), await newTenant()];
      const professional = await m.createProfessional(owner.id, { name: "Rafael", serviceIds: [], active: true });
      await m.exceptions.createAvailabilityException(
        owner.id,
        professional.id,
        { type: "BLOCK", date: "2030-03-04", start: 840, end: 960, reason: undefined },
        clock,
      );
      const [exception] = (await m.exceptions.listUpcomingExceptions(owner.id, professional.id, clock)).exceptions;

      await expect(m.exceptions.deleteAvailabilityException(intruder.id, exception.id)).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("clientes", () => {
    it("trocar para um WhatsApp que já é de outro cliente dá conflito", async () => {
      const { id: tenantId } = await newTenant();
      await prisma.customer.create({ data: { tenantId, name: "Ana", phone: "+5585911112222" } });
      const bruno = await prisma.customer.create({ data: { tenantId, name: "Bruno", phone: "+5585933334444" } });

      await expect(m.updateCustomer(tenantId, bruno.id, { name: "Bruno", phone: "+5585911112222" })).rejects.toBeInstanceOf(
        ConflictError,
      );
    });

    async function customerWithVisits(tenantId: string, name: string, phone: string) {
      const service = await m.createService(tenantId, serviceInput());
      const professional = await m.createProfessional(tenantId, { name: "Rafael", serviceIds: [service.id], active: true });
      const customer = await prisma.customer.create({ data: { tenantId, name, phone } });
      const visit = (startsAt: string, status: "COMPLETED" | "NO_SHOW" | "CANCELED" | "CONFIRMED", priceCents = 4500) =>
        prisma.appointment.create({
          data: {
            tenantId,
            professionalId: professional.id,
            serviceId: service.id,
            customerId: customer.id,
            startsAt: new Date(startsAt),
            endsAt: new Date(new Date(startsAt).getTime() + 30 * 60_000),
            status,
            priceSnapshotCents: priceCents,
            serviceNameSnapshot: "Corte",
            durationSnapshotMinute: 30,
            customerNameSnapshot: name,
          },
        });
      return { customer, visit };
    }

    it("a lista traz a última visita já ocorrida e não cancelada, e a contagem de agendamentos", async () => {
      const { id: tenantId } = await newTenant();
      const { customer, visit } = await customerWithVisits(tenantId, "Carlos", "+5585998760001");
      await visit("2030-03-01T12:00:00Z", "COMPLETED");
      await visit("2030-03-03T12:00:00Z", "CANCELED");
      await visit("2030-03-10T12:00:00Z", "CONFIRMED");

      const { customers } = await m.listCustomers(tenantId, "", FIXED_NOW);

      expect(customers).toEqual([
        expect.objectContaining({ id: customer.id, appointmentCount: 3, lastVisitAt: new Date("2030-03-01T12:00:00Z") }),
      ]);
    });

    it("busca por parte do nome ou do WhatsApp, só dentro da barbearia", async () => {
      const [owner, other] = [await newTenant(), await newTenant()];
      const ana = await prisma.customer.create({ data: { tenantId: owner.id, name: "Ana Souza", phone: "+5585911110000" } });
      await prisma.customer.create({ data: { tenantId: owner.id, name: "Bruno", phone: "+5585922220000" } });
      await prisma.customer.create({ data: { tenantId: other.id, name: "Ana Outra", phone: "+5585911110001" } });

      const ids = async (query: string) => (await m.listCustomers(owner.id, query)).customers.map((customer) => customer.id);

      expect(await ids("souza")).toEqual([ana.id]);
      expect(await ids("(85) 91111")).toEqual([ana.id]);
      expect(await ids("ana")).toEqual([ana.id]);
    });

    it("o histórico soma atendidos, faltas e cancelados, e o valor só dos atendidos", async () => {
      const { id: tenantId } = await newTenant();
      const { customer, visit } = await customerWithVisits(tenantId, "Carlos", "+5585998760002");
      await visit("2030-03-01T12:00:00Z", "COMPLETED", 4500);
      await visit("2030-03-02T12:00:00Z", "COMPLETED", 3000);
      await visit("2030-03-03T12:00:00Z", "NO_SHOW");
      await visit("2030-03-04T12:00:00Z", "CANCELED");

      const history = await m.getCustomerHistory(tenantId, customer.id);

      expect(history.stats).toEqual({ total: 4, completed: 2, noShow: 1, canceled: 1, completedCents: 7500 });
      expect(history.appointments.map((appointment) => appointment.status)).toEqual(["CANCELED", "NO_SHOW", "COMPLETED", "COMPLETED"]);
    });

    it("outra barbearia não abre o histórico do cliente", async () => {
      const [owner, intruder] = [await newTenant(), await newTenant()];
      const customer = await prisma.customer.create({ data: { tenantId: owner.id, name: "Carlos", phone: "+5585998760003" } });

      await expect(m.getCustomerHistory(intruder.id, customer.id)).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("dados da barbearia", () => {
    it("salvar as configurações muda os dados e as regras, mas nunca o link de agendamento", async () => {
      const { id: tenantId } = await newTenant();
      const { slug } = await m.settings.getBarbeariaSettings(tenantId);

      await m.settings.updateBarbeariaSettings(tenantId, {
        name: "Barbearia Nova",
        address: undefined,
        phone: "+558533334444",
        timezone: "America/Manaus",
        slotIntervalMinutes: 20,
        minAdvanceMinutes: 30,
        maxAdvanceDays: 15,
        cancellationWindowMinutes: 60,
      });

      expect(await m.settings.getBarbeariaSettings(tenantId)).toEqual({
        name: "Barbearia Nova",
        slug,
        address: null,
        phone: "+558533334444",
        timezone: "America/Manaus",
        slotIntervalMinutes: 20,
        minAdvanceMinutes: 30,
        maxAdvanceDays: 15,
        cancellationWindowMinutes: 60,
      });
    });

    it("barbearia inexistente não é encontrada", async () => {
      await expect(m.settings.getBarbeariaSettings(randomUUID())).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("resumo", () => {
    it("compara o período com o anterior e ignora outras barbearias", async () => {
      const [owner, other] = [await newTenant(), await newTenant()];
      const service = await m.createService(owner.id, serviceInput());
      const professional = await m.createProfessional(owner.id, { name: "Rafael", serviceIds: [service.id], active: true });
      await bookOnce(owner.id, professional.id, service.id, new Date("2030-03-04T11:00:00Z"), "COMPLETED");
      await bookOnce(owner.id, professional.id, service.id, new Date("2030-03-03T12:00:00Z"));
      await bookOnce(owner.id, professional.id, service.id, new Date("2030-02-24T12:00:00Z")); // semana anterior
      const otherService = await m.createService(other.id, serviceInput());
      const otherPro = await m.createProfessional(other.id, { name: "Outro", serviceIds: [], active: true });
      await bookOnce(other.id, otherPro.id, otherService.id, new Date("2030-03-04T11:00:00Z"));

      const dashboard = await m.getDashboard(owner.id, 7, clock);

      expect(dashboard.totals).toMatchObject({ booked: 2, revenueCents: 9000 });
      expect(dashboard.changes.booked).toBe(1);
      expect(dashboard.series).toHaveLength(7);
      expect(dashboard.byProfessional).toEqual([{ key: professional.id, label: "Rafael", value: 2 }]);
    });
  });

  describe("detalhe do agendamento (P2)", () => {
    async function ownerUseCases() {
      const { PrismaAppointmentRepository } = await import(
        "@/modules/appointments/infrastructure/prisma/prisma-appointment-repository"
      );
      const { RecordAttendance } = await import("@/modules/appointments/application/use-cases/record-attendance");
      const { CancelAppointmentByOwner } = await import(
        "@/modules/appointments/application/use-cases/cancel-appointment-by-owner"
      );
      const repo = new PrismaAppointmentRepository();
      return { attendance: new RecordAttendance(repo, clock), cancel: new CancelAppointmentByOwner(repo, clock) };
    }

    async function bookedAppointment(startsAt: Date) {
      const { id: tenantId } = await newTenant();
      const service = await m.createService(tenantId, serviceInput());
      const professional = await m.createProfessional(tenantId, { name: "Rafael", serviceIds: [service.id], active: true });
      const appointment = await bookOnce(tenantId, professional.id, service.id, startsAt);
      return { tenantId, appointmentId: appointment.id };
    }

    it("marcar atendido grava o status e passa a contar no faturamento do Resumo", async () => {
      const { attendance } = await ownerUseCases();
      const { tenantId, appointmentId } = await bookedAppointment(new Date("2030-03-04T11:00:00Z"));

      await attendance.execute({ tenantId, appointmentId, outcome: "COMPLETED" });

      expect((await prisma.appointment.findUniqueOrThrow({ where: { id: appointmentId } })).status).toBe("COMPLETED");
      expect((await m.getDashboard(tenantId, 7, clock)).statuses.COMPLETED).toBe(1);
    });

    it("cancelar pelo painel registra quem cancelou e o evento de outbox na mesma operação", async () => {
      const { cancel } = await ownerUseCases();
      const { tenantId, appointmentId } = await bookedAppointment(new Date("2030-03-05T12:00:00Z"));

      await cancel.execute({ tenantId, appointmentId });

      const saved = await prisma.appointment.findUniqueOrThrow({ where: { id: appointmentId } });
      expect(saved).toMatchObject({ status: "CANCELED", canceledBy: "OWNER", canceledAt: FIXED_NOW });
      const events = await prisma.outboxEvent.findMany({ where: { tenantId, type: "appointment.canceled" } });
      expect(events.map((e) => (e.payload as { appointmentId: string; canceledBy: string }))).toEqual([
        expect.objectContaining({ appointmentId, canceledBy: "OWNER" }),
      ]);
    });

    it("outra barbearia não marca nem cancela o agendamento", async () => {
      const { attendance, cancel } = await ownerUseCases();
      const { appointmentId } = await bookedAppointment(new Date("2030-03-04T11:00:00Z"));
      const intruder = await newTenant();

      await expect(attendance.execute({ tenantId: intruder.id, appointmentId, outcome: "NO_SHOW" })).rejects.toThrow(
        "Agendamento não encontrado.",
      );
      await expect(cancel.execute({ tenantId: intruder.id, appointmentId })).rejects.toThrow("Agendamento não encontrado.");
      expect((await prisma.appointment.findUniqueOrThrow({ where: { id: appointmentId } })).status).toBe("CONFIRMED");
    });
  });
});
