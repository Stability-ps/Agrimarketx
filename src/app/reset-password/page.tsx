import Link from "next/link";
import { KeyRound } from "lucide-react";
import { updatePassword } from "./actions";
import { ResetPasswordSession } from "./ResetPasswordSession";

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <main className="page-shell grid min-h-screen place-items-start px-4 pb-8 pt-[calc(env(safe-area-inset-top)+1rem)] sm:place-items-center sm:py-10">
      <section className="w-full max-w-md">
        <div className="mb-4 text-center sm:mb-8">
          <img src="/agrimarketx-logo.png" alt="AgriMarketX" className="mx-auto h-auto w-48 max-w-full sm:w-72" />
          <p className="mt-2 text-sm text-slate-600">Create a new password for your AgriMarketX account.</p>
        </div>
        <div className="panel p-5">
          <ResetPasswordSession />
          {message ? (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
              {message}
            </div>
          ) : null}
          <form action={updatePassword} className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">New Password</span>
              <input className="field mt-1" name="password" type="password" placeholder="8+ characters, upper, lower and a number" minLength={8} required />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Confirm Password</span>
              <input className="field mt-1" name="confirmPassword" type="password" placeholder="Repeat new password" minLength={8} required />
            </label>
            <p className="text-xs font-medium text-slate-500">Password must be at least 8 characters and include one uppercase character.</p>
            <button className="primary-button w-full gap-2" type="submit">
              <KeyRound size={18} />
              Update Password
            </button>
          </form>
          <Link href="/login" className="secondary-button mt-3 w-full">
            Back to Sign In
          </Link>
        </div>
      </section>
    </main>
  );
}
