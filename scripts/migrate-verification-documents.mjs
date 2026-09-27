#!/usr/bin/env node
// Moves seller verification documents from the PUBLIC farm-assets bucket
// (verification-documents/<farmId>/...) to the PRIVATE
// seller-verification-documents bucket (<farmId>/...).
//
// Safe by default:
//   node scripts/migrate-verification-documents.mjs              dry run, lists what would move
//   node scripts/migrate-verification-documents.mjs --apply      copy + verify + update storage_path
//   node scripts/migrate-verification-documents.mjs --apply --delete-source
//                                                                 also delete public copies that
//                                                                 were copied AND verified
//
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.
// Run migration 035 first (it creates the private bucket).
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const DELETE_SOURCE = process.argv.includes("--delete-source");
const SOURCE_BUCKET = "farm-assets";
const TARGET_BUCKET = "seller-verification-documents";
const LEGACY_PREFIX = "verification-documents/";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");

async function download(bucket, path) {
  const { data, error } = await admin.storage.from(bucket).download(path);
  if (error || !data) throw new Error(`download ${bucket}/${path}: ${error?.message ?? "no data"}`);
  return { buffer: Buffer.from(await data.arrayBuffer()), type: data.type };
}

const { data: rows, error } = await admin
  .from("seller_verification_documents")
  .select("id, storage_path")
  .like("storage_path", `${LEGACY_PREFIX}%`);

if (error) {
  console.error(`Could not list documents: ${error.message}`);
  process.exit(1);
}

console.log(`${rows.length} document(s) still in the public bucket. Mode: ${APPLY ? "APPLY" : "DRY RUN"}${DELETE_SOURCE ? " + delete source" : ""}`);

let moved = 0;
let failed = 0;

for (const row of rows) {
  const sourcePath = row.storage_path;
  const targetPath = sourcePath.slice(LEGACY_PREFIX.length);
  // Log ids and paths only, never file contents.
  console.log(`- ${row.id}: ${SOURCE_BUCKET}/${sourcePath} -> ${TARGET_BUCKET}/${targetPath}`);

  if (!APPLY) continue;

  try {
    const source = await download(SOURCE_BUCKET, sourcePath);
    const { error: uploadError } = await admin.storage
      .from(TARGET_BUCKET)
      .upload(targetPath, source.buffer, { contentType: source.type || "application/octet-stream", upsert: true });
    if (uploadError) throw new Error(`upload: ${uploadError.message}`);

    const copy = await download(TARGET_BUCKET, targetPath);
    if (sha256(copy.buffer) !== sha256(source.buffer)) throw new Error("verification failed: checksum mismatch");

    const { error: updateError } = await admin
      .from("seller_verification_documents")
      .update({ storage_path: targetPath })
      .eq("id", row.id);
    if (updateError) throw new Error(`update storage_path: ${updateError.message}`);

    if (DELETE_SOURCE) {
      const { error: removeError } = await admin.storage.from(SOURCE_BUCKET).remove([sourcePath]);
      if (removeError) throw new Error(`copied and verified, but source delete failed: ${removeError.message}`);
    }

    moved += 1;
    console.log("  ok (copied, checksum verified, path updated" + (DELETE_SOURCE ? ", public copy deleted)" : ")"));
  } catch (err) {
    failed += 1;
    console.error(`  FAILED: ${err.message}`);
  }
}

// Objects under the legacy prefix that no document row references.
const { data: orphans } = await admin.storage.from(SOURCE_BUCKET).list(LEGACY_PREFIX.slice(0, -1), { limit: 1000 });
console.log(`\nDone. moved=${moved} failed=${failed}. Top-level folders under ${LEGACY_PREFIX}: ${orphans?.length ?? 0} (inspect in the dashboard before any cleanup).`);
process.exit(failed ? 1 : 0);
