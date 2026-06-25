export const roles = ["Owner", "Manager", "Worker", "Vet", "Accountant", "Viewer"] as const;

export const animalStatuses = [
  "Alive",
  "To Be Sold",
  "To Be Culled",
  "Missing",
  "Stolen",
  "Sold",
  "Dead",
  "Reserved",
  "In Transit",
  "Quarantine",
  "Sick"
] as const;

export const animalOrigins = [
  "Bred on Farm",
  "Purchased",
  "Marketplace Purchase",
  "Imported",
  "Donated"
] as const;

export const defaultSpecies = [
  {
    name: "Cattle",
    young: "Calf",
    female: "Cow",
    male: "Bull",
    adultAgeMonths: 24,
    gestationDays: 283,
    terms: "Natural service or AI, pregnancy check 45-90 days after exposure."
  },
  {
    name: "Goats",
    young: "Kid",
    female: "Doe",
    male: "Buck",
    adultAgeMonths: 12,
    gestationDays: 150,
    terms: "Controlled exposure, kidding expected around 150 days."
  },
  {
    name: "Sheep",
    young: "Lamb",
    female: "Ewe",
    male: "Ram",
    adultAgeMonths: 12,
    gestationDays: 147,
    terms: "Ram exposure groups, lambing expected around 147 days."
  },
  {
    name: "Poultry",
    young: "Chick",
    female: "Hen",
    male: "Rooster",
    adultAgeMonths: 5,
    gestationDays: 21,
    terms: "Egg incubation and hatch tracking."
  },
  {
    name: "Rabbits",
    young: "Kit",
    female: "Doe",
    male: "Buck",
    adultAgeMonths: 6,
    gestationDays: 31,
    terms: "Nest box checks and litter tracking."
  },
  {
    name: "Pigs",
    young: "Piglet",
    female: "Sow",
    male: "Boar",
    adultAgeMonths: 8,
    gestationDays: 114,
    terms: "Service records with farrowing expected around 114 days."
  },
  {
    name: "Horses",
    young: "Foal",
    female: "Mare",
    male: "Stallion",
    adultAgeMonths: 48,
    gestationDays: 340,
    terms: "Cover records with foaling window tracking."
  },
  {
    name: "Donkeys",
    young: "Foal",
    female: "Jenny",
    male: "Jack",
    adultAgeMonths: 48,
    gestationDays: 365,
    terms: "Long gestation tracking with late-pregnancy reminders."
  }
] as const;
