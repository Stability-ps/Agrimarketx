import { AppShell, PageHeader } from "@/components/AppShell";
import { DateField } from "@/components/DateField";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFarm } from "@/lib/farm-server";
import { createFinanceTransaction } from "./actions";

const financeTransactionOptions = [
  ["sale", "Sale"],
  ["expense", "General expense"],
  ["feed_purchase", "Feed purchase"],
  ["medication_cost", "Medication cost"],
  ["transport_cost", "Transport cost"],
  ["labour_cost", "Labour cost"],
  ["valuation", "Herd valuation"],
  ["payment", "Payment received"]
] as const;

const expenseTypes = new Set(["expense", "feed_purchase", "medication_cost", "transport_cost", "labour_cost"]);
const incomeTypes = new Set(["sale", "payment"]);

function money(amount: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0
  }).format(amount);
}

function optionLabel(value?: string | null) {
  return financeTransactionOptions.find(([key]) => key === value)?.[1] ?? value ?? "Transaction";
}

export default async function FinancePage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  const supabase = await createClient();
  const farm = await getCurrentFarm();

  const { data: animals } = await supabase
    .from("animals")
    .select("id, animal_code, tag_number, breed, species(name)")
    .eq("farm_id", farm.id)
    .order("animal_code", { ascending: true });

  const { data: transactions } = await supabase
    .from("finance_transactions")
    .select("id, transaction_type, amount, currency, description, invoice_number, paid_at, due_at, animal_id, animals(animal_code, tag_number)")
    .eq("farm_id", farm.id)
    .order("created_at", { ascending: false })
    .limit(30);

  const rows = transactions ?? [];
  const income = rows
    .filter((transaction) => incomeTypes.has(transaction.transaction_type))
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const expenses = rows
    .filter((transaction) => expenseTypes.has(transaction.transaction_type))
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const valuation = rows
    .filter((transaction) => transaction.transaction_type === "valuation")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const profit = income - expenses;
  const outstanding = rows
    .filter((transaction) => transaction.due_at && !transaction.paid_at)
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const cards = [
    { title: "Income", value: money(income), detail: "Sales and payments received" },
    { title: "Expenses", value: money(expenses), detail: "Feed, medication, transport, labour and other costs" },
    { title: "Profit / loss", value: money(profit), detail: profit >= 0 ? "Current positive position" : "Current loss position" },
    { title: "Herd valuation", value: money(valuation), detail: "Recorded livestock valuation" }
  ];

  return (
    <AppShell>
      <PageHeader
        title="Finance"
        description="Track sales, expenses, invoices, outstanding payments, livestock valuation and profit/loss."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((item) => (
          <div key={item.title} className="panel p-4">
            <p className="text-sm font-semibold text-slate-500">{item.title}</p>
            <p className="mt-2 text-2xl font-bold">{item.value}</p>
            <p className="mt-2 text-sm text-slate-600">{item.detail}</p>
          </div>
        ))}
      </div>
      <section className="panel mt-6 p-5">
        <h3 className="font-bold">Add transaction</h3>
        {message ? (
          <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-900">
            {message}
          </div>
        ) : null}
        <form action={createFinanceTransaction} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label>
            <span className="text-sm font-semibold">Transaction type</span>
            <select className="field mt-1" name="transactionType">
              {financeTransactionOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>
            <span className="text-sm font-semibold">Linked animal</span>
            <select className="field mt-1" name="animalId">
              <option value="">Farm level / no animal</option>
              {(animals ?? []).map((animal) => {
                const species = Array.isArray(animal.species) ? animal.species[0] : animal.species;
                return (
                  <option key={animal.id} value={animal.id}>
                    {animal.animal_code} {animal.tag_number ? `· Tag ${animal.tag_number}` : ""} {species?.name ? `· ${species.name}` : ""} {animal.breed ? `· ${animal.breed}` : ""}
                  </option>
                );
              })}
            </select>
          </label>
          <label>
            <span className="text-sm font-semibold">Amount</span>
            <input className="field mt-1" name="amount" placeholder="e.g. 1250" />
          </label>
          <label>
            <span className="text-sm font-semibold">Invoice number</span>
            <input className="field mt-1" name="invoiceNumber" placeholder="Optional" />
          </label>
          <label className="sm:col-span-2">
            <span className="text-sm font-semibold">Description</span>
            <input className="field mt-1" name="description" placeholder="e.g. Feed purchase, goat sale, vaccine stock" />
          </label>
          <label>
            <span className="text-sm font-semibold">Paid date</span>
            <DateField className="field mt-1" name="paidAt" defaultValue={new Date().toISOString().slice(0, 10)} />
          </label>
          <label>
            <span className="text-sm font-semibold">Due date</span>
            <DateField className="field mt-1" name="dueAt" />
          </label>
          <button className="primary-button sm:w-fit" type="submit">Save transaction</button>
        </form>
      </section>
      <section className="panel mt-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold">Recent transactions</h3>
          <p className="text-sm font-semibold text-slate-600">Outstanding: {money(outstanding)}</p>
        </div>
        <div className="mt-4 space-y-2">
          {rows.length === 0 ? (
            <p className="text-sm text-slate-500">No finance transactions yet.</p>
          ) : (
            rows.map((transaction) => {
              const animal = Array.isArray(transaction.animals) ? transaction.animals[0] : transaction.animals;
              const isExpense = expenseTypes.has(transaction.transaction_type);
              return (
                <div key={transaction.id} className="rounded-md border border-slate-200 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-semibold">{optionLabel(transaction.transaction_type)} · {transaction.description}</div>
                    <div className={isExpense ? "font-bold text-red-700" : "font-bold text-brand-green"}>
                      {isExpense ? "-" : "+"}{money(Number(transaction.amount))}
                    </div>
                  </div>
                  <div className="mt-1 text-slate-600">
                    {animal?.animal_code ? `Animal: ${animal.animal_code}${animal.tag_number ? ` · Tag ${animal.tag_number}` : ""}` : "Farm level"}
                    {transaction.invoice_number ? ` · Invoice ${transaction.invoice_number}` : ""}
                  </div>
                  <div className="mt-1 text-slate-500">
                    {transaction.paid_at ? `Paid: ${transaction.paid_at}` : "Not paid"}
                    {transaction.due_at ? ` · Due: ${transaction.due_at}` : ""}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </AppShell>
  );
}
