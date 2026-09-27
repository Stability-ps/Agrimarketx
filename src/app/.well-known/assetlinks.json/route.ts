import { NextResponse } from "next/server";

// Android App Links verification for za.co.agrimarketx.app.
//
// ANDROID_SHA256_CERT_FINGERPRINTS must hold the SHA-256 fingerprints (comma
// separated, AA:BB:... format) of every certificate that signs installed
// builds: the Google Play App Signing key AND the upload key, both shown in
// Play Console -> Test and release -> Setup -> App integrity. Fingerprints are
// never guessed; with none configured this returns [] and links simply open
// in the browser.
export const dynamic = "force-dynamic";

const FINGERPRINT = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/;

export function GET() {
  const fingerprints = (process.env.ANDROID_SHA256_CERT_FINGERPRINTS ?? "")
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter((value) => FINGERPRINT.test(value));

  const body = fingerprints.length
    ? [
        {
          relation: ["delegate_permission/common.handle_all_urls"],
          target: {
            namespace: "android_app",
            package_name: "za.co.agrimarketx.app",
            sha256_cert_fingerprints: fingerprints
          }
        }
      ]
    : [];

  return NextResponse.json(body, {
    headers: { "Cache-Control": "public, max-age=3600" }
  });
}
