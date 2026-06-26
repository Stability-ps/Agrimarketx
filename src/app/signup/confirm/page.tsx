import Link from "next/link";
import { MailCheck } from "lucide-react";
import { resendConfirmationEmail } from "@/app/login/actions";

export default async function SignupConfirmationPage({
  searchParams
}: {
  searchParams: Promise<{ email?: string; message?: string }>;
}) {
  const { email = "", message } = await searchParams;

  return (
    <main className="page-shell grid min-h-screen place-items-center px-4 py-10">
      <section className="w-full max-w-md rounded-md border border-slate-200 bg-white p-6 text-center shadow-soft">
        <img src="/agrimarketx-logo.png" alt="AgriMarketX" className="mx-auto h-auto w-56 max-w-full" />
        <MailCheck className="mx-auto mt-6 text-brand-green" size={42} />
        <h1 className="mt-4 text-2xl font-bold text-brand-navy">Confirm your email</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {message ?? "We sent a confirmation link to your email address. Open it to activate your account, then log in manually."}
        </p>
        {email ? <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">{email}</p> : null}
        <form action={resendConfirmationEmail} className="mt-5">
          <input type="hidden" name="email" value={email} />
          <button className="secondary-button w-full" type="submit" disabled={!email}>
            Resend confirmation email
          </button>
        </form>
        <Link href={`/login${email ? `?email=${encodeURIComponent(email)}` : ""}` as never} className="primary-button mt-3 w-full">
          Go to Login
        </Link>
      </section>
    </main>
  );
}
