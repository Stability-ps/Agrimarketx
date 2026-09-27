import { NextResponse } from "next/server";
import { verificationDocumentLocation } from "@/lib/files";
import { requirePlatformAdmin } from "@/lib/privileged-reads";

// Seller verification documents are private. Admins open them through a
// signed URL that expires after 60 seconds; the URL is never stored or shown
// on a page.
const SIGNED_URL_SECONDS = 60;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { admin } = await requirePlatformAdmin();
  const { id } = await params;

  const { data: document } = await admin
    .from("seller_verification_documents")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();

  if (!document?.storage_path) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  const { bucket, path } = verificationDocumentLocation(document.storage_path);
  const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, SIGNED_URL_SECONDS);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "Document is not available." }, { status: 404 });
  }

  return NextResponse.redirect(data.signedUrl, { headers: { "Cache-Control": "no-store" } });
}
