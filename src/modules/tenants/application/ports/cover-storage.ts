/** Onde a foto de capa da barbearia fica guardada. Os objetos são públicos para leitura. */
export interface CoverStorage {
  put(key: string, bytes: Uint8Array, contentType: string): Promise<void>;
  remove(key: string): Promise<void>;
  publicUrl(key: string): string;
}
