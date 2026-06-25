export const statusOptions = [
  ["alive", "Alive"],
  ["to_be_sold", "To Be Sold"],
  ["to_be_culled", "To Be Culled"],
  ["missing", "Missing"],
  ["stolen", "Stolen"],
  ["sold", "Sold"],
  ["dead", "Dead"],
  ["reserved", "Reserved"],
  ["in_transit", "In Transit"],
  ["quarantine", "Quarantine"],
  ["sick", "Sick"]
] as const;

export const originOptions = [
  ["bred_on_farm", "Bred on Farm"],
  ["purchased", "Purchased"],
  ["marketplace_purchase", "Marketplace Purchase"],
  ["imported", "Imported"],
  ["donated", "Donated"]
] as const;

export const genderOptions = [
  ["female", "Female"],
  ["male", "Male"],
  ["unknown", "Unknown"]
] as const;

export const healthRecordOptions = [
  ["vaccination", "Vaccination"],
  ["treatment", "Treatment"],
  ["deworming", "Deworming"],
  ["dipping", "Dipping"],
  ["vet_record", "Vet record"]
] as const;

export function optionLabel(options: readonly (readonly [string, string])[], value?: string | null) {
  return options.find(([key]) => key === value)?.[1] ?? value ?? "Not set";
}
