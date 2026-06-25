import { Activity, AlertTriangle, Banknote, CalendarHeart, HeartPulse, LineChart, ShieldCheck, Syringe, UsersRound } from "lucide-react";

export const activeFarm = {
  name: "Mavuno Mixed Farm",
  location: "Limpopo, South Africa",
  role: "Owner"
};

export const dashboardStats = [
  { label: "Total animals", value: "1,284", detail: "+42 this month", icon: UsersRound },
  { label: "Males", value: "386", detail: "30% of herd", icon: ShieldCheck },
  { label: "Females", value: "712", detail: "55% of herd", icon: UsersRound },
  { label: "Young animals", value: "186", detail: "Auto-categorised", icon: Activity },
  { label: "Pregnant animals", value: "73", detail: "18 due soon", icon: CalendarHeart },
  { label: "Vaccines due", value: "29", detail: "Next 14 days", icon: Syringe },
  { label: "Health alerts", value: "8", detail: "Needs review", icon: AlertTriangle },
  { label: "Profit summary", value: "R 84,200", detail: "YTD net", icon: Banknote }
];

export const animals = [
  {
    id: "AGX-CAT-0019",
    passport: "PAS-ZA-2026-0019",
    tag: "LMP-019",
    rfid: "982000411008719",
    species: "Cattle",
    breed: "Bonsmara",
    gender: "Female",
    category: "Cow",
    dob: "2021-08-14",
    weight: "486 kg",
    status: "Alive",
    origin: "Bred on Farm",
    location: "North Camp / Breeding Herd",
    sire: "AGX-CAT-0002",
    dam: "AGX-CAT-0007"
  },
  {
    id: "AGX-GOA-0088",
    passport: "PAS-ZA-2026-0088",
    tag: "GOA-088",
    rfid: "982000411008744",
    species: "Goats",
    breed: "Boer Goat",
    gender: "Male",
    category: "Buck",
    dob: "2023-02-03",
    weight: "71 kg",
    status: "To Be Sold",
    origin: "Purchased",
    location: "East Section / Sale Group",
    sire: "Unknown",
    dam: "Unknown"
  },
  {
    id: "AGX-SHP-0142",
    passport: "PAS-ZA-2026-0142",
    tag: "SHP-142",
    rfid: "982000411008799",
    species: "Sheep",
    breed: "Dorper",
    gender: "Female",
    category: "Ewe",
    dob: "2022-11-24",
    weight: "64 kg",
    status: "Pregnant",
    origin: "Marketplace Purchase",
    location: "South Camp / Lambing Group",
    sire: "AGX-SHP-0091",
    dam: "AGX-SHP-0038"
  }
];

export const recentActivities = [
  "Pregnancy check completed for 18 ewes",
  "Vaccine batch VX-204 applied to North Camp cattle",
  "Marketplace offer received for AGX-GOA-0088",
  "Invoice INV-1028 marked paid"
];

export const healthItems = [
  { title: "Vaccinations due", count: 29, detail: "Cattle and goats due in the next 14 days" },
  { title: "Deworming due", count: 47, detail: "Mostly young animals in East Section" },
  { title: "Withdrawal periods", count: 6, detail: "Animals blocked from sale until cleared" },
  { title: "Medicine stock alerts", count: 3, detail: "Low stock: Multivax, wound spray, dip" }
];

export const breedingItems = [
  { title: "Expected births", count: 18, detail: "Kidding, lambing and calving windows" },
  { title: "Pregnancy checks", count: 31, detail: "Due this month" },
  { title: "Weaning records", count: 12, detail: "Ready to review" },
  { title: "Top sire performance", count: "92%", detail: "Confirmed pregnancy rate" }
];

export const financeItems = [
  { title: "Sales revenue", value: "R 214,900", detail: "Current year" },
  { title: "Expenses", value: "R 130,700", detail: "Feed, labour, medicine, transport" },
  { title: "Outstanding payments", value: "R 27,400", detail: "4 open invoices" },
  { title: "Herd valuation", value: "R 1.86m", detail: "Estimated live asset value" }
];

export const reportNames = [
  "Animal register",
  "Animal detail report",
  "Health report",
  "Treatment report",
  "Vaccination report",
  "Breeding report",
  "Birth and offspring report",
  "Weight and growth report",
  "Mortality report",
  "Sales report",
  "Expenses report",
  "Profit/loss report",
  "Herd valuation report",
  "Marketplace sales report"
];

export const subscriptionPlans = [
  { name: "Starter", price: "R299/mo", animals: "Up to 150 animals", features: "Core records, health, reports" },
  { name: "Professional", price: "R899/mo", animals: "Up to 2,000 animals", features: "Marketplace, finance, passports, PDF exports" },
  { name: "Enterprise", price: "Custom", animals: "Unlimited farms and animals", features: "Advanced roles, admin tools, integrations" }
];

export const trendIcon = LineChart;
