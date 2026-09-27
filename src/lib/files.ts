export function cleanFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "") || "upload";
}

export function publicStorageUrl(bucket: string, path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${baseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

/** Private bucket for seller verification documents (service role only). */
export const VERIFICATION_DOCUMENTS_BUCKET = "seller-verification-documents";

/**
 * Documents uploaded before the private bucket existed live in the public
 * farm-assets bucket under verification-documents/. They stay readable (via
 * signed URLs for admins) until scripts/migrate-verification-documents.mjs
 * moves them and rewrites storage_path.
 */
export function verificationDocumentLocation(storagePath: string) {
  return storagePath.startsWith("verification-documents/")
    ? { bucket: "farm-assets", path: storagePath }
    : { bucket: VERIFICATION_DOCUMENTS_BUCKET, path: storagePath };
}

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const IMAGE_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic"]);
const DOCUMENT_CONTENT_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const HEIF_BRANDS = new Set(["heic", "heix", "hevc", "hevx", "mif1", "msf1", "heif"]);

function ascii(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.slice(start, end));
}

/** Detects the real file type from its leading bytes (never trusts file.type). */
export async function detectFileType(file: File) {
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());

  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return "image/jpeg";
  if (head[0] === 0x89 && ascii(head, 1, 4) === "PNG") return "image/png";
  if (ascii(head, 0, 4) === "GIF8") return "image/gif";
  if (ascii(head, 0, 4) === "RIFF" && ascii(head, 8, 12) === "WEBP") return "image/webp";
  if (ascii(head, 4, 8) === "ftyp" && HEIF_BRANDS.has(ascii(head, 8, 12))) return "image/heic";
  if (ascii(head, 0, 5) === "%PDF-") return "application/pdf";

  return null;
}

export type UploadValidation =
  | { ok: true; contentType: string }
  | { ok: false; message: string };

/**
 * Server-side upload validation: size limit plus content sniffing.
 * `image` = listing/animal/profile photos; `document` = seller verification
 * documents (PDF, JPEG or PNG only). Use the returned contentType for storage.
 */
export async function validateUpload(file: File, kind: "image" | "document"): Promise<UploadValidation> {
  if (file.size === 0) {
    return { ok: false, message: "The selected file is empty." };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, message: "Files must be 10 MB or smaller." };
  }

  const contentType = await detectFileType(file);
  const allowed = kind === "image" ? IMAGE_CONTENT_TYPES : DOCUMENT_CONTENT_TYPES;

  if (!contentType || !allowed.has(contentType)) {
    return {
      ok: false,
      message: kind === "image"
        ? "Please upload a JPEG, PNG, WebP, GIF or HEIC image."
        : "Please upload a PDF, JPEG or PNG document."
    };
  }

  return { ok: true, contentType };
}
