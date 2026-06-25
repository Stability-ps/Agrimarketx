export function formatRand(value: number | string | null | undefined, suffix = "") {
  const number = Number(value ?? 0);

  if (!Number.isFinite(number)) {
    return suffix ? `R0 ${suffix}` : "R0";
  }

  const formatted = new Intl.NumberFormat("en-ZA", {
    maximumFractionDigits: Number.isInteger(number) ? 0 : 2
  }).format(number).replace(/,/g, " ");

  return suffix ? `R${formatted} ${suffix}` : `R${formatted}`;
}
