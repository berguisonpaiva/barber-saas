// Acrescenta à migração "init" as constraints que o Prisma não expressa no schema:
//  - extensão btree_gist
//  - EXCLUDE: um profissional não pode ter dois agendamentos CONFIRMED sobrepostos (RN-05)
//  - CHECKs de consistência
// Uso: chamado por `npm run db:init` logo após `prisma migrate dev --create-only`.
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const MARKER = "-- barber-saas:custom-constraints";
const dir = join(process.cwd(), "prisma", "migrations");
if (!existsSync(dir)) {
  console.error("Nenhuma pasta prisma/migrations encontrada.");
  process.exit(1);
}

const initDir = readdirSync(dir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.endsWith("_init"))
  .map((d) => d.name)
  .sort()
  .at(0);

if (!initDir) {
  console.error('Migração "*_init" não encontrada. Rode: npx prisma migrate dev --name init --create-only');
  process.exit(1);
}

const file = join(dir, initDir, "migration.sql");
const sql = readFileSync(file, "utf8");
if (sql.includes(MARKER)) {
  console.log(`Constraints já presentes em ${initDir}.`);
  process.exit(0);
}

const constraints = readFileSync(join(process.cwd(), "prisma", "custom-constraints.sql"), "utf8");
const extra = `

${MARKER}
${constraints}`;

writeFileSync(file, sql + extra);
console.log(`Constraints adicionadas em ${initDir}/migration.sql`);
