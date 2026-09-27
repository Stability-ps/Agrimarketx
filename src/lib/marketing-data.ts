import {
  BadgeDollarSign,
  BarChart3,
  Calculator,
  HeartPulse,
  Map,
  MessageCircle,
  PawPrint,
  Repeat,
  ShieldCheck,
  Smartphone,
  Store,
  Truck
} from "lucide-react";

export const marketingFeatures = [
  {
    title: "Farm Records & Marketplace Activity",
    description: "Keep livestock records, product listings, seller activity, enquiries, saved listings, requests, photos, videos and documents in one place.",
    icon: PawPrint
  },
  {
    title: "Breeding Management",
    description: "Track exposure, pregnancy checks, expected births, birth outcomes, offspring, weaning and sire or dam performance.",
    icon: Repeat
  },
  {
    title: "Health & Products",
    description: "Record vaccines, treatments, deworming, dipping, product batches, withdrawal periods, due dates and reminders.",
    icon: HeartPulse
  },
  {
    title: "Farm Structure",
    description: "Organise operations by company, farm, camp or section, herd or group, then place each animal exactly where it belongs.",
    icon: Map
  },
  {
    title: "Agricultural Marketplace",
    description: "List livestock, feed, crops, equipment, vehicles, infrastructure and services while protecting exact location details.",
    icon: Store
  },
  {
    title: "Ownership Transfer",
    description: "Transfer livestock between users while preserving history, invoices, certificates and digital passport records.",
    icon: Truck
  },
  {
    title: "Finance & Reports",
    description: "Track farm sales, expenses, marketplace activity, valuation, outstanding payments, profit/loss and practical reports.",
    icon: BarChart3
  },
  {
    title: "Digital Passport",
    description: "Every animal can carry a QR-ready passport with ownership, health, weight, breeding and document history.",
    icon: ShieldCheck
  },
  {
    title: "Mobile Ready",
    description: "Designed for practical mobile field workflows, responsive farm records and marketplace use on supported devices.",
    icon: Smartphone
  }
];

export const workflowSteps = [
  "Check dashboard alerts for farm records, health, sales, requests and marketplace activity.",
  "Open animal, product, service or marketplace records from one clean console.",
  "Capture treatments, breeding events, product listings, buyer requests and finance items.",
  "Use reminders and due-date logic to plan farm work, animal care and marketplace follow-ups.",
  "Review reports, passports, listings and transfer documents before decisions."
];

export const pricingPlans = [
  {
    name: "Starter",
    price: "R299",
    period: "/ month",
    description: "For small farms and sellers getting organised.",
    items: ["Up to 150 animals", "1 farm", "Marketplace tools", "Health and breeding", "Core reports"]
  },
  {
    name: "Professional",
    price: "R899",
    period: "/ month",
    description: "For growing farms and agricultural sellers that trade and report often.",
    items: ["Up to 2,000 animals", "Up to 5 farms", "Marketplace listings", "Digital passports", "Finance and PDF exports"],
    featured: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For larger operations, breeders and organisations.",
    items: ["Unlimited farms", "Advanced roles", "Admin dashboards", "Verification workflows", "Custom support"]
  }
];

export const faqs = [
  {
    question: "Can AgriMarketX manage more than one farm?",
    answer: "Yes. The data model supports account or company ownership, multiple farms, camps, sections, herds, groups and role-based access."
  },
  {
    question: "Which agricultural categories are supported?",
    answer: "AgriMarketX supports livestock, livestock herds, feed and inputs, crops and produce, farm equipment, vehicles, infrastructure, agricultural services and other agricultural products. Livestock records still support default and custom species."
  },
  {
    question: "Does it support RFID or NFC tags?",
    answer: "Animal records include RFID/NFC reference fields. Hardware scanning is not presented as an active feature until a supported scanning workflow is enabled."
  },
  {
    question: "Can I sell agricultural products through the platform?",
    answer: "Yes. AgriMarketX includes marketplace listings, wanted requests, offers, chat, controlled location reveal and livestock ownership transfer workflows."
  },
  {
    question: "How does the animal passport work?",
    answer: "Each animal can have a unique passport ID and QR code with private or public views, plus ownership, health, weight, breeding and document history."
  },
];

export const highlightStats = [
  { label: "Categories available", value: "8+" },
  { label: "Marketplace features", value: "12+" },
  { label: "Farm tools", value: "10+" },
  { label: "Business types", value: "Many" }
];

export const calculatorFeature = {
  title: "Farm planning tools",
  description: "Plan animal care, wanted requests, listings, due dates, health reminders, breeding dates and marketplace follow-ups.",
  icon: Calculator
};

export const supportChannels = [
  { label: "Get help", value: "Contact AgriMarketX support", icon: MessageCircle },
  { label: "Create account", value: "Start using marketplace and farm tools", icon: ShieldCheck },
  { label: "Billing", value: "No in-app checkout is currently enabled", icon: BadgeDollarSign }
];
