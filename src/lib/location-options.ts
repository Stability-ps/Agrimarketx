import { provinceDirectory } from "@/lib/provinces";

export const southAfricanProvinces = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape"
] as const;

export function townsForProvince(province: string | null | undefined) {
  const match = provinceDirectory.find((item) => item.name.toLowerCase() === String(province ?? "").toLowerCase());
  return match?.towns ?? [];
}

export function publicLocation(town: string | null | undefined, province: string | null | undefined) {
  const cleanTown = String(town ?? "").trim();
  const cleanProvince = String(province ?? "").trim();

  if (cleanTown && cleanProvince) {
    return `Near ${cleanTown}, ${cleanProvince}`;
  }

  if (cleanTown) {
    return `Near ${cleanTown}`;
  }

  if (cleanProvince) {
    return cleanProvince;
  }

  return "";
}
