import "server-only";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

export interface UploadResult {
  url: string;
}

export type UploadKind = "image" | "document";

export interface StorageDriver {
  upload(file: File, folder: string, kind?: UploadKind): Promise<UploadResult>;
  delete(url: string): Promise<void>;
}

const ALLOWED_TYPES: Record<UploadKind, Set<string>> = {
  image: new Set(["image/jpeg", "image/png", "image/webp"]),
  document: new Set(["application/pdf"]),
};
const MAX_BYTES: Record<UploadKind, number> = {
  image: 5 * 1024 * 1024, // 5MB
  document: 15 * 1024 * 1024, // 15MB
};

function assertValidUpload(file: File, kind: UploadKind) {
  if (!ALLOWED_TYPES[kind].has(file.type)) {
    throw new Error(kind === "document" ? "Only PDF files are allowed." : "Only JPEG, PNG, or WebP images are allowed.");
  }
  if (file.size > MAX_BYTES[kind]) {
    throw new Error(`File must be ${MAX_BYTES[kind] / (1024 * 1024)}MB or smaller.`);
  }
}

function extensionFor(file: File) {
  switch (file.type) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "application/pdf":
      return "pdf";
    default:
      return "jpg";
  }
}

// Dev-only: writes into public/uploads on the local filesystem.
// NOT viable on Vercel (ephemeral/read-only filesystem outside /tmp) — use the "s3" driver there.
class LocalStorageDriver implements StorageDriver {
  async upload(file: File, folder: string, kind: UploadKind = "image"): Promise<UploadResult> {
    assertValidUpload(file, kind);
    const fileName = `${randomUUID()}.${extensionFor(file)}`;
    const dir = path.join(process.cwd(), "public", "uploads", folder);
    await fs.mkdir(dir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(dir, fileName), buffer);
    return { url: `/uploads/${folder}/${fileName}` };
  }

  async delete(url: string): Promise<void> {
    if (!url.startsWith("/uploads/")) return;
    const filePath = path.join(process.cwd(), "public", url);
    await fs.rm(filePath, { force: true });
  }
}

// Any S3-compatible bucket: AWS S3, Cloudflare R2, Supabase Storage, Backblaze B2, ...
class S3StorageDriver implements StorageDriver {
  private client: S3Client;
  private bucket: string;
  private publicBaseUrl: string;

  constructor() {
    const endpoint = process.env.S3_ENDPOINT || undefined;
    const region = process.env.S3_REGION || "auto";
    this.bucket = requireEnv("S3_BUCKET");
    this.publicBaseUrl = requireEnv("S3_PUBLIC_BASE_URL").replace(/\/$/, "");
    this.client = new S3Client({
      endpoint,
      region,
      forcePathStyle: Boolean(endpoint),
      credentials: {
        accessKeyId: requireEnv("S3_ACCESS_KEY_ID"),
        secretAccessKey: requireEnv("S3_SECRET_ACCESS_KEY"),
      },
    });
  }

  async upload(file: File, folder: string, kind: UploadKind = "image"): Promise<UploadResult> {
    assertValidUpload(file, kind);
    const key = `${folder}/${randomUUID()}.${extensionFor(file)}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );
    return { url: `${this.publicBaseUrl}/${key}` };
  }

  async delete(url: string): Promise<void> {
    if (!url.startsWith(this.publicBaseUrl)) return;
    const key = url.slice(this.publicBaseUrl.length + 1);
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name} for STORAGE_DRIVER=s3`);
  return value;
}

let driver: StorageDriver | null = null;

export function getStorage(): StorageDriver {
  if (driver) return driver;
  driver = process.env.STORAGE_DRIVER === "s3" ? new S3StorageDriver() : new LocalStorageDriver();
  return driver;
}
