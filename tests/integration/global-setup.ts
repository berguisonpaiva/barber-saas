import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

const root = process.cwd();

/**
 * Recria o schema do banco de teste a partir do schema.prisma + constraints customizadas.
 * Só roda com DATABASE_URL_TEST, e só aceita banco cujo nome termina em "_test".
 */
export default async function setup() {
  const url = process.env.DATABASE_URL_TEST;
  if (!url) return;

  const database = new URL(url).pathname.slice(1);
  if (!database.endsWith("_test")) {
    throw new Error(`DATABASE_URL_TEST precisa apontar para um banco "*_test"; recebido "${database}".`);
  }

  const schemaSql = execFileSync(
    process.execPath,
    [join(root, "node_modules/prisma/build/index.js"), "migrate", "diff", "--from-empty", "--to-schema", "prisma/schema.prisma", "--script"],
    { cwd: root, encoding: "utf8", env: { ...process.env, DATABASE_URL: url }, stdio: ["ignore", "pipe", "pipe"] },
  );
  const constraintsSql = readFileSync(join(root, "prisma/custom-constraints.sql"), "utf8");

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;");
    await client.query(schemaSql);
    await client.query(constraintsSql);
  } finally {
    await client.end();
  }
}
