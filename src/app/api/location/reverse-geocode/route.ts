import { NextResponse } from "next/server";
import { nearestKnownLocation, parseCoordinate } from "@/lib/location-distance";

function provinceFromComponents(components: Array<{ long_name?: string; types?: string[] }>) {
  return components.find((component) => component.types?.includes("administrative_area_level_1"))?.long_name ?? "";
}

function townFromComponents(components: Array<{ long_name?: string; types?: string[] }>) {
  return components.find((component) => component.types?.includes("locality"))?.long_name
    ?? components.find((component) => component.types?.includes("postal_town"))?.long_name
    ?? components.find((component) => component.types?.includes("administrative_area_level_2"))?.long_name
    ?? components.find((component) => component.types?.includes("sublocality"))?.long_name
    ?? "";
}

function localFallback(latitude: number, longitude: number) {
  const nearest = nearestKnownLocation({ latitude, longitude });

  if (!nearest) {
    return {
      label: "",
      town: "",
      province: "",
      source: "none"
    };
  }

  return {
    label: `${nearest.town}, ${nearest.province}`,
    town: nearest.town,
    province: nearest.province,
    source: "local"
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const latitude = parseCoordinate(url.searchParams.get("lat"));
  const longitude = parseCoordinate(url.searchParams.get("lng"));

  if (latitude === null || longitude === null) {
    return NextResponse.json({ error: "Invalid coordinates." }, { status: 400 });
  }

  const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (googleKey) {
    try {
      const params = new URLSearchParams({
        latlng: `${latitude},${longitude}`,
        key: googleKey,
        region: "za",
        result_type: "locality|postal_town|administrative_area_level_2|sublocality"
      });
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`, {
        cache: "no-store"
      });
      const payload = await response.json();
      const result = payload.results?.[0];

      if (payload.status === "OK" && result) {
        const town = townFromComponents(result.address_components ?? []);
        const province = provinceFromComponents(result.address_components ?? []);
        const label = [town, province].filter(Boolean).join(", ") || result.formatted_address || "";

        if (label) {
          return NextResponse.json({
            label,
            town,
            province,
            source: "google"
          });
        }
      }
    } catch {
      // Google reverse geocoding is helpful, but the marketplace must still work without it.
    }
  }

  return NextResponse.json(localFallback(latitude, longitude));
}
