import Link from "next/link";
import { Activity, AlertTriangle, Banknote, CalendarHeart, HeartPulse, ShieldCheck, Syringe, UsersRound } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFarm } from "@/lib/farm-server";
import { healthRecordOptions, optionLabel } from "@/lib/animal-options";

const expenseTypes = new Set(["expense", "feed_purchase", "medication_cost", "transport_cost", "labour_cost"]);
const incomeTypes = new Set(["sale", "payment"]);

function money(amount: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0
  }).format(amount);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const farm = await getCurrentFarm();
  const todayValue = today();
  const twoWeeks = addDays(14);
  const oneMonthAgo = addDays(-30);

  const { data: animals } = await supabase
    .from("animals")
    .select("id, animal_code, gender, age_category, status, created_at, species(name)")
    .eq("farm_id", farm.id);

  const { data: healthDue } = await supabase
    .from("health_records")
    .select("id, record_type, product_name, due_at, animals(animal_code, tag_number)")
    .eq("farm_id", farm.id)
    .gte("due_at", todayValue)
    .lte("due_at", twoWeeks)
    .order("due_at", { ascending: true })
    .limit(6);

  const { data: breedingDue } = await supabase
    .from("breeding_records")
    .select("id, record_type, expected_birth_date, female:female_animal_id(animal_code, tag_number)")
    .eq("farm_id", farm.id)
    .gte("expected_birth_date", todayValue)
    .order("expected_birth_date", { ascending: true })
    .limit(6);

  const { data: financeRows } = await supabase
    .from("finance_transactions")
    .select("id, transaction_type, amount, description, created_at")
    .eq("farm_id", farm.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: recentHealth } = await supabase
    .from("health_records")
    .select("id, record_type, product_name, administered_at, animals(animal_code)")
    .eq("farm_id", farm.id)
    .order("created_at", { ascending: false })
    .limit(3);

  const { data: recentBreeding } = await supabase
    .from("breeding_records")
    .select("id, record_type, event_date, female:female_animal_id(animal_code)")
    .eq("farm_id", farm.id)
    .order("created_at", { ascending: false })
    .limit(3);

  const animalRows = animals ?? [];
  const finance = financeRows ?? [];
  const totalAnimals = animalRows.length;
  const males = animalRows.filter((animal) => animal.gender === "male").length;
  const females = animalRows.filter((animal) => animal.gender === "female").length;
  const youngAnimals = animalRows.filter((animal) => {
    const category = String(animal.age_category ?? "").toLowerCase();
    return category.includes("young") || ["kid", "lamb", "calf", "chick", "kit", "foal", "piglet"].some((term) => category.includes(term));
  }).length;
  const healthAlerts = animalRows.filter((animal) => ["sick", "quarantine", "missing", "stolen"].includes(animal.status)).length;
  const newThisMonth = animalRows.filter((animal) => animal.created_at >= oneMonthAgo).length;
  const income = finance.filter((row) => incomeTypes.has(row.transaction_type)).reduce((sum, row) => sum + Number(row.amount), 0);
  const expenses = finance.filter((row) => expenseTypes.has(row.transaction_type)).reduce((sum, row) => sum + Number(row.amount), 0);
  const profit = income - expenses;

  const stats = [
    { label: "Total animals", value: totalAnimals, detail: `${newThisMonth} added in the last 30 days`, icon: UsersRound },
    { label: "Males", value: males, detail: totalAnimals ? `${Math.round((males / totalAnimals) * 100)}% of herd` : "No animals yet", icon: ShieldCheck },
    { label: "Females", value: females, detail: totalAnimals ? `${Math.round((females / totalAnimals) * 100)}% of herd` : "No animals yet", icon: UsersRound },
    { label: "Young animals", value: youngAnimals, detail: "From saved age categories", icon: Activity },
    { label: "Expected births", value: breedingDue?.length ?? 0, detail: "Upcoming breeding dates", icon: CalendarHeart },
    { label: "Vaccines / health due", value: healthDue?.length ?? 0, detail: "Due in the next 14 days", icon: Syringe },
    { label: "Health alerts", value: healthAlerts, detail: "Sick, quarantine, missing or stolen", icon: AlertTriangle },
    { label: "Profit summary", value: money(profit), detail: "Income minus expenses", icon: Banknote }
  ];

  const recentActivities = [
    ...(recentHealth ?? []).map((record) => {
      const animal = Array.isArray(record.animals) ? record.animals[0] : record.animals;
      return `${optionLabel(healthRecordOptions, record.record_type)} recorded${animal?.animal_code ? ` for ${animal.animal_code}` : ""}${record.product_name ? ` · ${record.product_name}` : ""}`;
    }),
    ...(recentBreeding ?? []).map((record) => {
      const female = Array.isArray(record.female) ? record.female[0] : record.female;
      return `Breeding ${record.record_type.replace("_", " ")} recorded${female?.animal_code ? ` for ${female.animal_code}` : ""}`;
    }),
    ...finance.slice(0, 3).map((row) => `${row.description} · ${money(Number(row.amount))}`)
  ].slice(0, 8);

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        description="A quick view of herd numbers, breeding, health work, sales and farm profitability."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="panel p-5">
          <h3 className="font-bold">Breeding and finance snapshot</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Link href="/breeding" className="rounded-lg bg-green-50 p-4 transition hover:bg-green-100">
              <p className="text-sm text-green-800">Expected births</p>
              <p className="mt-2 text-2xl font-bold">{breedingDue?.length ?? 0}</p>
            </Link>
            <Link href="/finance" className="rounded-lg bg-slate-50 p-4 transition hover:bg-slate-100">
              <p className="text-sm text-slate-600">Expenses</p>
              <p className="mt-2 text-2xl font-bold">{money(expenses)}</p>
            </Link>
            <Link href="/finance" className="rounded-lg bg-slate-50 p-4 transition hover:bg-slate-100">
              <p className="text-sm text-slate-600">Sales revenue</p>
              <p className="mt-2 text-2xl font-bold">{money(income)}</p>
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-slate-200 p-3">
              <h4 className="text-sm font-bold">Health due soon</h4>
              <div className="mt-2 space-y-2">
                {(healthDue ?? []).length === 0 ? (
                  <p className="text-sm text-slate-500">No health reminders due in the next 14 days.</p>
                ) : (
                  healthDue?.map((record) => {
                    const animal = Array.isArray(record.animals) ? record.animals[0] : record.animals;
                    return (
                      <div key={record.id} className="text-sm text-slate-600">
                        {optionLabel(healthRecordOptions, record.record_type)} · {record.due_at}
                        {animal?.animal_code ? ` · ${animal.animal_code}` : ""}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <div className="rounded-md border border-slate-200 p-3">
              <h4 className="text-sm font-bold">Expected births</h4>
              <div className="mt-2 space-y-2">
                {(breedingDue ?? []).length === 0 ? (
                  <p className="text-sm text-slate-500">No expected births recorded yet.</p>
                ) : (
                  breedingDue?.map((record) => {
                    const female = Array.isArray(record.female) ? record.female[0] : record.female;
                    return (
                      <div key={record.id} className="text-sm text-slate-600">
                        {record.expected_birth_date}{female?.animal_code ? ` · ${female.animal_code}` : ""}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </section>
        <section className="panel p-5">
          <h3 className="font-bold">Recent activity</h3>
          <div className="mt-4 space-y-3">
            {recentActivities.length === 0 ? (
              <p className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-500">
                No activity yet. Add animals, health records, breeding records or finance transactions to see updates here.
              </p>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity} className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
                  {activity}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
