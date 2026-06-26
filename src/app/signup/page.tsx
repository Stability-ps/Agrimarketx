import Link from "next/link";
import { ShoppingCart, Sprout, UserPlus } from "lucide-react";
import { resendConfirmationEmail, signInWithGoogle } from "@/app/login/actions";
import { createAccount } from "./actions";

export default async function SignupPage({
  searchParams
}: {
  searchParams: Promise<{ accountType?: string; email?: string; fullName?: string; message?: string; phone?: string }>;
}) {
  const { accountType = "buyer", email = "", fullName = "", message, phone = "" } = await searchParams;
  const selectedAccountType = accountType === "seller" ? "seller" : "buyer";

  return (
    <main className="page-shell min-h-screen px-4 py-8 lg:px-8">
      <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div>
          <img src="/agrimarketx-logo.png" alt="AgriMarketX" className="h-auto w-56 max-w-full" />
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-brand-navy">Create your AgriMarketX account</h1>
          <p className="mt-3 text-slate-600">Start as a buyer, or set up your farm and selling tools in one clean onboarding flow.</p>
          <div className="mt-6 rounded-md border border-green-100 bg-green-50 p-4 text-sm text-green-900">
            One account works for marketplace buying, farm management, livestock records, product listings and selling.
          </div>
        </div>

        <section className="panel p-5">
          {message ? (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
              {message}
            </div>
          ) : null}
          <form action={createAccount} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="text-sm font-semibold text-slate-700">Full name</span>
                <input className="field mt-1" name="fullName" placeholder="Patric Moyo" defaultValue={fullName} required />
              </label>
              <label>
                <span className="text-sm font-semibold text-slate-700">Phone number</span>
                <input className="field mt-1" name="phone" placeholder="+27 61 000 0000" defaultValue={phone} required />
              </label>
            </div>
            <label>
              <span className="text-sm font-semibold text-slate-700">Email address</span>
              <input className="field mt-1" name="email" type="email" placeholder="farmer@example.com" defaultValue={email} required />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="text-sm font-semibold text-slate-700">Password</span>
                <input className="field mt-1" name="password" type="password" placeholder="At least 8 characters" minLength={8} required />
              </label>
              <label>
                <span className="text-sm font-semibold text-slate-700">Confirm password</span>
                <input className="field mt-1" name="confirmPassword" type="password" placeholder="Repeat password" minLength={8} required />
              </label>
            </div>
            <p className="text-xs font-medium text-slate-500">Password must be at least 8 characters and include one uppercase character.</p>

            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">How do you want to use AgriMarketX?</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer gap-3 rounded-md border border-slate-200 p-4 transition hover:border-brand-green">
                  <input type="radio" name="accountType" value="buyer" defaultChecked={selectedAccountType === "buyer"} />
                  <span>
                    <ShoppingCart className="text-brand-green" size={22} />
                    <span className="mt-2 block font-bold">Buy only</span>
                    <span className="mt-1 block text-sm text-slate-600">Browse, save, follow farms and contact sellers.</span>
                  </span>
                </label>
                <label className="flex cursor-pointer gap-3 rounded-md border border-slate-200 p-4 transition hover:border-brand-green">
                  <input type="radio" name="accountType" value="seller" defaultChecked={selectedAccountType === "seller"} />
                  <span>
                    <Sprout className="text-brand-green" size={22} />
                    <span className="mt-2 block font-bold">Manage my farm / Sell</span>
                    <span className="mt-1 block text-sm text-slate-600">Create farm records, manage operations, and publish marketplace listings.</span>
                  </span>
                </label>
              </div>
            </div>

            <button className="primary-button w-full gap-2" type="submit">
              <UserPlus size={18} />
              Create account
            </button>
            <button className="w-full text-sm font-semibold text-slate-600 hover:text-brand-green hover:underline" type="submit" formAction={resendConfirmationEmail} formNoValidate>
              Resend confirmation email
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
            <div className="h-px flex-1 bg-slate-200" />
            or
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <form action={signInWithGoogle}>
            <input type="hidden" name="next" value="/account/type" />
            <button className="secondary-button w-full" type="submit">Continue with Google</button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-600">
            Already have an account? <Link href={`/login${email ? `?email=${encodeURIComponent(email)}` : ""}` as never} className="font-semibold text-brand-green">Sign in</Link>
          </p>
        </section>
      </section>
    </main>
  );
}
