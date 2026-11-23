import type { CoverStorage } from "@/modules/tenants/application/ports/cover-storage";

/** Adapter em memória do storage da capa: o segundo adapter da porta (o outro é o S3). */
export class InMemoryCoverStorage implements CoverStorage {
  private readonly objects = new Map<string, { bytes: Uint8Array; contentType: string }>();

  constructor(private readonly options: { failRemovals?: boolean } = {}) {}

  get keys(): readonly string[] {
    return [...this.objects.keys()];
  }

  contentTypeOf(key: string): string | undefined {
    return this.objects.get(key)?.contentType;
  }

  async put(key: string, bytes: Uint8Array, contentType: string): Promise<void> {
    this.objects.set(key, { bytes, contentType });
  }

  async remove(key: string): Promise<void> {
    if (this.options.failRemovals) throw new Error("storage indisponível");
    this.objects.delete(key);
  }

  publicUrl(key: string): string {
    return `https://capas.teste/${key}`;
  }
}
