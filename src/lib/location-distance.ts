import { provinceDirectory } from "@/lib/provinces";

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type KnownLocation = Coordinates & {
  town: string;
  province: string;
};

export const radiusOptions = [
  { label: "5km", value: "5" },
  { label: "10km", value: "10" },
  { label: "25km", value: "25" },
  { label: "50km", value: "50" },
  { label: "100km", value: "100" },
  { label: "All South Africa", value: "all" }
] as const;

const knownLocations: KnownLocation[] = [
  { town: "Pretoria", province: "Gauteng", latitude: -25.7479, longitude: 28.2293 },
  { town: "Johannesburg", province: "Gauteng", latitude: -26.2041, longitude: 28.0473 },
  { town: "Nigel", province: "Gauteng", latitude: -26.4314, longitude: 28.4771 },
  { town: "Bronkhorstspruit", province: "Gauteng", latitude: -25.8102, longitude: 28.7425 },
  { town: "Polokwane", province: "Limpopo", latitude: -23.9045, longitude: 29.4689 },
  { town: "Tzaneen", province: "Limpopo", latitude: -23.8333, longitude: 30.1667 },
  { town: "Mokopane", province: "Limpopo", latitude: -24.1944, longitude: 29.0097 },
  { town: "Nelspruit", province: "Mpumalanga", latitude: -25.4753, longitude: 30.9694 },
  { town: "Mbombela / Nelspruit", province: "Mpumalanga", latitude: -25.4753, longitude: 30.9694 },
  { town: "Witbank", province: "Mpumalanga", latitude: -25.8713, longitude: 29.2332 },
  { town: "Bloemfontein", province: "Free State", latitude: -29.0852, longitude: 26.1596 },
  { town: "Welkom", province: "Free State", latitude: -27.9777, longitude: 26.7351 },
  { town: "Durban", province: "KwaZulu-Natal", latitude: -29.8587, longitude: 31.0218 },
  { town: "Pietermaritzburg", province: "KwaZulu-Natal", latitude: -29.6006, longitude: 30.3794 },
  { town: "Cape Town", province: "Western Cape", latitude: -33.9249, longitude: 18.4241 },
  { town: "Stellenbosch", province: "Western Cape", latitude: -33.9321, longitude: 18.8602 },
  { town: "Paarl", province: "Western Cape", latitude: -33.7342, longitude: 18.9621 },
  { town: "Gqeberha", province: "Eastern Cape", latitude: -33.9608, longitude: 25.6022 },
  { town: "East London", province: "Eastern Cape", latitude: -33.0292, longitude: 27.8546 },
  { town: "Rustenburg", province: "North West", latitude: -25.6676, longitude: 27.2421 },
  { town: "Potchefstroom", province: "North West", latitude: -26.7145, longitude: 27.0970 },
  { town: "Kimberley", province: "Northern Cape", latitude: -28.7282, longitude: 24.7499 },
  { town: "Upington", province: "Northern Cape", latitude: -28.4478, longitude: 21.2561 }
];

function normalize(text: string | null | undefined) {
  return String(text ?? "").trim().toLowerCase();
}

export function allKnownLocations() {
  const directoryLocations = provinceDirectory.flatMap((province) =>
    province.towns.map((town) => {
      const known = knownLocations.find(
        (item) => normalize(item.town) === normalize(town) && normalize(item.province) === normalize(province.name)
      );

      return known ?? { town, province: province.name, latitude: Number.NaN, longitude: Number.NaN };
    })
  );

  return [...knownLocations, ...directoryLocations].filter(
    (location, index, list) =>
      index === list.findIndex((item) => normalize(item.town) === normalize(location.town) && normalize(item.province) === normalize(location.province))
  );
}

export function parseCoordinate(value: string | number | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseRadiusKm(value: string | null | undefined) {
  if (!value || value === "all") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function haversineDistanceKm(from: Coordinates, to: Coordinates) {
  const earthRadiusKm = 6371;
  const latDistance = ((to.latitude - from.latitude) * Math.PI) / 180;
  const lngDistance = ((to.longitude - from.longitude) * Math.PI) / 180;
  const startLat = (from.latitude * Math.PI) / 180;
  const endLat = (to.latitude * Math.PI) / 180;
  const a =
    Math.sin(latDistance / 2) * Math.sin(latDistance / 2) +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDistance / 2) * Math.sin(lngDistance / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findKnownLocation(town: string | null | undefined, province: string | null | undefined) {
  const cleanTown = normalize(town);
  const cleanProvince = normalize(province);

  if (!cleanTown && !cleanProvince) {
    return null;
  }

  return allKnownLocations().find((item) => {
    const townMatches = cleanTown ? normalize(item.town).includes(cleanTown) || cleanTown.includes(normalize(item.town)) : true;
    const provinceMatches = cleanProvince ? normalize(item.province) === cleanProvince : true;
    return townMatches && provinceMatches && Number.isFinite(item.latitude) && Number.isFinite(item.longitude);
  }) ?? null;
}

export function nearestKnownLocation(coords: Coordinates) {
  const locations = allKnownLocations().filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
  return locations
    .map((location) => ({ location, distance: haversineDistanceKm(coords, location) }))
    .sort((a, b) => a.distance - b.distance)[0]?.location ?? null;
}

export function listingCoordinates(listing: {
  latitude?: number | string | null;
  longitude?: number | string | null;
  town?: string | null;
  province?: string | null;
}) {
  const latitude = parseCoordinate(listing.latitude);
  const longitude = parseCoordinate(listing.longitude);

  if (latitude !== null && longitude !== null) {
    return { latitude, longitude };
  }

  const known = findKnownLocation(listing.town, listing.province);
  return known ? { latitude: known.latitude, longitude: known.longitude } : null;
}

export function publicAreaLabel(coords: Coordinates) {
  const nearest = nearestKnownLocation(coords);
  return nearest ? `${nearest.town}, ${nearest.province}` : "your area";
}
