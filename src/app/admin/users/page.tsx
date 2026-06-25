import { AppShell, PageHeader } from "@/components/AppShell";
import { AdminNav } from "@/components/AdminNav";
import { createClient } from "@/lib/supabase/server";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, avatar_url, account_role, account_type_selected, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <AppShell>
      <PageHeader title="Users" description="View farmers, buyers, sellers and platform profiles." />
      <AdminNav />
      <div className="panel overflow-hidden">
        <div className="grid gap-3 p-4">
          {(users ?? []).map((user) => (
            <div key={user.id} className="grid gap-3 rounded-md border border-slate-200 p-3 sm:grid-cols-[1fr_1fr_auto]">
              <div>
                <p className="font-bold">{user.full_name ?? "Unnamed user"}</p>
                <p className="text-sm text-slate-600">{user.email ?? "No email"}</p>
              </div>
              <p className="text-sm text-slate-600">{user.phone ?? "No phone"}</p>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold capitalize text-slate-600">
                {String(user.account_role ?? "buyer").replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
