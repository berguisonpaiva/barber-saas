import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import type { CoverStorage } from "@/modules/tenants/application/ports/cover-storage";

const endpoint = process.env.S3_TEST_ENDPOINT;
const bucket = process.env.S3_TEST_BUCKET ?? "barber-saas-test";
const PNG_1PX = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64",
  ),
);

describe.skipIf(!endpoint)("adapter S3 da foto de capa (storage S3 compatível)", () => {
  let storage: CoverStorage;

  beforeAll(async () => {
    const { S3CoverStorage } = await import("@/modules/tenants/infrastructure/s3-cover-storage");
    storage = new S3CoverStorage({
      endpoint: endpoint!,
      region: process.env.S3_TEST_REGION ?? "us-east-1",
      bucket,
      accessKeyId: process.env.S3_TEST_ACCESS_KEY_ID ?? "barber",
      secretAccessKey: process.env.S3_TEST_SECRET_ACCESS_KEY ?? "barber-storage",
      forcePathStyle: true,
      publicBaseUrl: `${endpoint}/${bucket}`,
    });
  });

  const newKey = () => `tenants/teste/cover-${randomUUID()}.png`;

  it("a foto gravada fica acessível pelo endereço público, com o tipo certo", async () => {
    const key = newKey();

    await storage.put(key, PNG_1PX, "image/png");
    const response = await fetch(storage.publicUrl(key));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(PNG_1PX);
  });

  it("a foto apagada deixa de ser servida", async () => {
    const key = newKey();
    await storage.put(key, PNG_1PX, "image/png");

    await storage.remove(key);
    const response = await fetch(storage.publicUrl(key));

    expect(response.ok).toBe(false);
  });

  it("o endereço público é a base configurada mais a chave", () => {
    expect(storage.publicUrl("tenants/abc/cover-1.webp")).toBe(`${endpoint}/${bucket}/tenants/abc/cover-1.webp`);
  });
});
