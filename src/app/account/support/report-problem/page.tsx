import { AppShell, PageHeader } from "@/components/AppShell";
import { createSupportTicket } from "@/app/account/messages/actions";

export default async function ReportProblemPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <AppShell>
      <PageHeader title="Report a Problem" description="Create a support ticket for admin review." />
      {message ? <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-900">{message}</div> : null}
      <section className="mx-auto max-w-2xl rounded-md border border-slate-200 bg-white p-5">
        <form action={createSupportTicket} className="grid gap-3">
          <label>
            <span className="text-sm font-semibold">Category</span>
            <select className="field mt-1" name="category" defaultValue="support">
              <option value="support">General support</option>
              <option value="marketplace">Marketplace issue</option>
              <option value="animal_records">Animal records</option>
              <option value="farm_account">Farm account</option>
              <option value="safety">Safety concern</option>
              <option value="bug">App problem</option>
            </select>
          </label>
          <label>
            <span className="text-sm font-semibold">Priority</span>
            <select className="field mt-1" name="priority" defaultValue="normal">
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>
          <label>
            <span className="text-sm font-semibold">Subject</span>
            <input className="field mt-1" name="subject" placeholder="Short problem title" required />
          </label>
          <label>
            <span className="text-sm font-semibold">What happened?</span>
            <textarea className="field mt-1 min-h-32" name="description" placeholder="Explain the problem. Add listing name, animal ID or page if useful." required />
          </label>
          <button className="primary-button sm:w-fit" type="submit">Create support ticket</button>
        </form>
      </section>
    </AppShell>
  );
}
