import { AppShell, PageHeader } from "@/components/AppShell";
import { AdminNav } from "@/components/AdminNav";

const auditItems = [
  "Listing approved",
  "Listing rejected",
  "Listing removed",
  "Wanted request approved",
  "Wanted request rejected",
  "User suspended",
  "Farm verified",
  "Seller verified",
  "Transfer reviewed",
  "Support ticket updated",
  "Subscription updated",
  "Admin note added"
];

export default function AdminAuditLogsPage() {
  return (
    <AppShell>
      <PageHeader title="Audit Logs" description="Track important platform moderation and admin actions." />
      <AdminNav />
      <section className="panel p-5">
        <div className="grid gap-2 sm:grid-cols-2">
          {auditItems.map((item) => (
            <div key={item} className="rounded-md bg-slate-50 p-3 text-sm font-semibold text-slate-700">{item}</div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
