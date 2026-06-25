import { AlertTriangle, LifeBuoy, Mail, MessageCircle, RefreshCcw, ShieldCheck } from "lucide-react";
import { AccountMenuGroup, AccountMenuItem } from "@/components/AccountMenu";
import { AppShell, PageHeader } from "@/components/AppShell";

export default function SupportPage() {
  return (
    <AppShell>
      <PageHeader title="Support" description="Get help, report problems and learn how to trade safely." />
      <div className="mx-auto max-w-2xl">
        <AccountMenuGroup>
          <AccountMenuItem href="/account/support/help-centre" icon={LifeBuoy} title="Help Centre" description="Common questions and quick guidance." />
          <AccountMenuItem href="/account/support/safety-advice" icon={ShieldCheck} title="Safety Advice" description="Tips for safer livestock and farm trade." />
          <AccountMenuItem href="mailto:support@agrimarketx.com" icon={Mail} title="Email Us" description="Send the AgriMarketX team a message." />
          <AccountMenuItem href="/account/messages" icon={MessageCircle} title="Live Chat" description="Chat with buyers, sellers and support." />
          <AccountMenuItem href="/account/support/report-problem" icon={AlertTriangle} title="Report a Problem" description="Create a support ticket and notify admin." />
          <AccountMenuItem href="/login" icon={RefreshCcw} title="App Reset" description="Return to login if the app feels stuck." />
        </AccountMenuGroup>
      </div>
    </AppShell>
  );
}
