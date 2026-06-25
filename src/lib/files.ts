export function cleanFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "") || "upload";
}

export function publicStorageUrl(bucket: string, path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${baseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

export function isImageFile(file: File) {
  return file.type.startsWith("image/");
}
