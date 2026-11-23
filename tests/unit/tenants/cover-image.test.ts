import { describe, expect, it } from "vitest";
import { coverImageTypeOf } from "@/modules/tenants/domain/cover-image";

const bytes = (...values: number[]) => Uint8Array.from([...values, ...new Array(16).fill(0)]);
const ascii = (text: string) => [...text].map((c) => c.charCodeAt(0));

describe("tipo da foto de capa pelo conteúdo do arquivo", () => {
  it.each([
    ["JPEG", bytes(0xff, 0xd8, 0xff, 0xe0), { contentType: "image/jpeg", extension: "jpg" }],
    ["PNG", bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a), { contentType: "image/png", extension: "png" }],
    ["WebP", bytes(...ascii("RIFF"), 0, 0, 0, 0, ...ascii("WEBP")), { contentType: "image/webp", extension: "webp" }],
  ])("reconhece %s", (_name, file, expected) => {
    expect(coverImageTypeOf(file)).toEqual(expected);
  });

  it.each([
    ["GIF", bytes(...ascii("GIF89a"))],
    ["texto com extensão de imagem", bytes(...ascii("isto nao e uma foto"))],
    ["RIFF que não é WebP (áudio WAV)", bytes(...ascii("RIFF"), 0, 0, 0, 0, ...ascii("WAVE"))],
    ["arquivo vazio", new Uint8Array()],
  ])("recusa %s", (_name, file) => {
    expect(coverImageTypeOf(file)).toBeNull();
  });
});
