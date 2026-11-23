export interface CoverImageType {
  contentType: "image/jpeg" | "image/png" | "image/webp";
  extension: "jpg" | "png" | "webp";
}

/** Tamanho máximo da foto de capa enviada pelo proprietário. */
export const MAX_COVER_BYTES = 5 * 1024 * 1024;

const startsWith = (bytes: Uint8Array, signature: readonly number[], offset = 0) =>
  signature.every((value, index) => bytes[offset + index] === value);

const ascii = (text: string) => [...text].map((char) => char.charCodeAt(0));

/** Reconhece a foto pela assinatura do conteúdo (nunca pela extensão do arquivo). */
export function coverImageTypeOf(bytes: Uint8Array): CoverImageType | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return { contentType: "image/jpeg", extension: "jpg" };
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { contentType: "image/png", extension: "png" };
  if (startsWith(bytes, ascii("RIFF")) && startsWith(bytes, ascii("WEBP"), 8)) {
    return { contentType: "image/webp", extension: "webp" };
  }
  return null;
}
