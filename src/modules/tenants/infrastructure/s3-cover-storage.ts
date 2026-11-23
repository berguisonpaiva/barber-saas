import "server-only";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { CoverStorage } from "../application/ports/cover-storage";

export interface S3CoverStorageConfig {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
  /** Base pública de leitura (ex.: domínio do bucket no R2). */
  publicBaseUrl: string;
}

/** Adapter S3 compatível (R2, RustFS, MinIO, S3). */
export class S3CoverStorage implements CoverStorage {
  private readonly client: S3Client;

  constructor(private readonly config: S3CoverStorageConfig) {
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      forcePathStyle: config.forcePathStyle,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }

  static fromEnv(env: NodeJS.ProcessEnv = process.env): S3CoverStorage {
    const required = (name: string) => {
      const value = env[name];
      if (!value) throw new Error(`Storage da foto de capa não configurado: defina ${name}.`);
      return value;
    };
    return new S3CoverStorage({
      endpoint: required("S3_ENDPOINT"),
      region: required("S3_REGION"),
      bucket: required("S3_BUCKET"),
      accessKeyId: required("S3_ACCESS_KEY_ID"),
      secretAccessKey: required("S3_SECRET_ACCESS_KEY"),
      forcePathStyle: env.S3_FORCE_PATH_STYLE === "true",
      publicBaseUrl: required("S3_PUBLIC_URL"),
    });
  }

  async put(key: string, bytes: Uint8Array, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: bytes,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
  }

  async remove(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }));
  }

  publicUrl(key: string): string {
    return coverPublicUrl(this.config.publicBaseUrl, key);
  }
}

function coverPublicUrl(publicBaseUrl: string, key: string): string {
  return `${publicBaseUrl.replace(/\/+$/, "")}/${key}`;
}

/** Só monta endereços públicos (sem cliente S3): basta S3_PUBLIC_URL. */
export const envCoverUrls: Pick<CoverStorage, "publicUrl"> = {
  publicUrl(key) {
    const base = process.env.S3_PUBLIC_URL;
    if (!base) throw new Error("Storage da foto de capa não configurado: defina S3_PUBLIC_URL.");
    return coverPublicUrl(base, key);
  },
};
