/**
 * Dados de demonstração: Barbearia do João (mesmos dados do protótipo no Figma).
 * Login: joao@demo.com / barber123   ·   Página pública: /barbearia-do-joao
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  const existing = await prisma.tenant.findUnique({ where: { slug: "barbearia-do-joao" } });
  if (existing) {
    console.log("Seed já aplicado.");
    return;
  }

  const tenant = await prisma.tenant.create({
    data: {
      name: "Barbearia do João",
      slug: "barbearia-do-joao",
      timezone: "America/Fortaleza",
      status: "ACTIVE",
      address: "Rua das Flores, 120 · Aldeota, Fortaleza",
      owner: {
        create: { name: "João Pereira", email: "joao@demo.com", passwordHash: await bcrypt.hash("barber123", 12) },
      },
      subscription: {
        create: {
          stripeCustomerId: "cus_demo",
          status: "TRIALING",
          trialEndsAt: new Date(Date.now() + 14 * 86_400_000),
          currentPeriodEnd: new Date(Date.now() + 14 * 86_400_000),
        },
      },
    },
  });

  const services = await Promise.all(
    [
      ["Corte masculino", 4500, 30],
      ["Barba", 3500, 30],
      ["Corte + Barba", 7000, 60],
      ["Pezinho", 1500, 15],
    ].map(([name, priceCents, durationMinutes], i) =>
      prisma.service.create({
        data: { tenantId: tenant.id, name: String(name), priceCents: Number(priceCents), durationMinutes: Number(durationMinutes), sortOrder: i },
      }),
    ),
  );

  const pros = await Promise.all(
    ["Rafael Lima", "Diego Alves", "Marcos Souza"].map((name) =>
      prisma.professional.create({ data: { tenantId: tenant.id, name } }),
    ),
  );

  await prisma.professionalService.createMany({
    data: pros.flatMap((p) => services.map((s) => ({ tenantId: tenant.id, professionalId: p.id, serviceId: s.id }))),
  });

  // Seg–Sex 09:00–12:00 e 13:00–19:00; Sáb 08:00–14:00
  const rules = pros.flatMap((p) => [
    ...[1, 2, 3, 4, 5].flatMap((weekday) => [
      { tenantId: tenant.id, professionalId: p.id, weekday, startMinute: 9 * 60, endMinute: 12 * 60 },
      { tenantId: tenant.id, professionalId: p.id, weekday, startMinute: 13 * 60, endMinute: 19 * 60 },
    ]),
    { tenantId: tenant.id, professionalId: p.id, weekday: 6, startMinute: 8 * 60, endMinute: 14 * 60 },
  ]);
  await prisma.availabilityRule.createMany({ data: rules });

  console.log(`Seed ok: ${tenant.slug} · login joao@demo.com / barber123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
