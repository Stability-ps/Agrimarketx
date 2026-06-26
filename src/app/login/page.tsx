import { Mail } from "lucide-react";
import Link from "next/link";
import { requestPasswordReset, resendConfirmationEmail, signInWithEmail, signInWithGoogle } from "./actions";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ email?: string; message?: string; next?: string; unconfirmed?: string }>;
}) {
  const { email = "", message, next = "", unconfirmed } = await searchParams;

  return (
    <main className="page-shell grid min-h-screen place-items-center px-4 py-10">
      <section className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img
            src="/agrimarketx-logo.png"
            alt="AgriMarketX"
            className="mx-auto h-auto w-72 max-w-full"
          />
          <p className="mt-2 text-sm text-slate-600">Agricultural marketplace, farm records and trading tools for Africa.</p>
        </div>
        <div className="panel p-5">
          {message ? (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
              {message}
            </div>
          ) : null}
          <form action={signInWithEmail} className="space-y-4">
            {next ? <input type="hidden" name="next" value={next} /> : null}
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Email address</span>
              <input className="field mt-1" name="email" type="email" placeholder="farmer@example.com" defaultValue={email} required />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Password</span>
              <input className="field mt-1" name="password" type="password" placeholder="Password" required />
            </label>
            <button className="primary-button w-full gap-2" type="submit">
              <Mail size={18} />
              Sign in
            </button>
            <button className="w-full text-sm font-semibold text-brand-green hover:underline" type="submit" formAction={requestPasswordReset} formNoValidate>
              Forgot password
            </button>
            {unconfirmed === "1" ? (
              <button className="w-full text-sm font-semibold text-slate-600 hover:text-brand-green hover:underline" type="submit" formAction={resendConfirmationEmail} formNoValidate>
                Resend confirmation email
              </button>
            ) : null}
          </form>
          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
            <div className="h-px flex-1 bg-slate-200" />
            or
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <form action={signInWithGoogle}>
            {next ? <input type="hidden" name="next" value={next} /> : null}
            <button className="secondary-button w-full" type="submit">Continue with Google</button>
          </form>
          <Link href={`/signup${email ? `?email=${encodeURIComponent(email)}` : ""}` as never} className="secondary-button mt-3 w-full">
            Create account
          </Link>
        </div>
      </section>
    </main>
  );
}
