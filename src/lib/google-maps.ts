"use client";

declare global {
  interface Window {
    google?: any;
    initAgriMarketXGoogleMaps?: () => void;
  }
}

let googleMapsPromise: Promise<any> | null = null;

export function googleMapsApiKey() {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
}

export function loadGoogleMaps() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser."));
  }

  if (window.google?.maps?.places) {
    return Promise.resolve(window.google);
  }

  if (!googleMapsApiKey()) {
    return Promise.reject(new Error("Google Maps API key is missing."));
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-agrimarketx-google-maps]");

    window.initAgriMarketXGoogleMaps = () => {
      resolve(window.google);
    };

    if (existing) {
      existing.addEventListener("error", () => reject(new Error("Google Maps failed to load.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    const params = new URLSearchParams({
      key: googleMapsApiKey(),
      libraries: "places",
      callback: "initAgriMarketXGoogleMaps",
      loading: "async",
      region: "ZA"
    });

    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.dataset.agrimarketxGoogleMaps = "true";
    script.addEventListener("error", () => reject(new Error("Google Maps failed to load.")), { once: true });
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

export function placeProvince(place: any) {
  const components = place?.address_components ?? [];
  const province = components.find((component: any) => component.types?.includes("administrative_area_level_1"));
  return province?.long_name ?? "";
}

export function placeTown(place: any) {
  const components = place?.address_components ?? [];
  const town = components.find((component: any) => component.types?.includes("locality"))
    ?? components.find((component: any) => component.types?.includes("postal_town"))
    ?? components.find((component: any) => component.types?.includes("administrative_area_level_2"))
    ?? components.find((component: any) => component.types?.includes("sublocality"));

  return town?.long_name ?? place?.name ?? "";
}

export function placeCoordinates(place: any) {
  const location = place?.geometry?.location;
  if (!location) {
    return null;
  }

  return {
    latitude: Number(location.lat().toFixed(7)),
    longitude: Number(location.lng().toFixed(7))
  };
}

export async function reverseGeocodeCoordinates(coords: { latitude: number; longitude: number }) {
  try {
    const params = new URLSearchParams({
      lat: String(coords.latitude),
      lng: String(coords.longitude)
    });
    const response = await fetch(`/api/location/reverse-geocode?${params.toString()}`);

    if (response.ok) {
      const payload = await response.json();
      if (payload?.label) {
        return {
          label: String(payload.label),
          town: String(payload.town ?? ""),
          province: String(payload.province ?? "")
        };
      }
    }
  } catch {
    // Fall through to Maps JavaScript geocoder if the lightweight endpoint is not reachable.
  }

  const google = await loadGoogleMaps();
  const geocoder = new google.maps.Geocoder();
  const response = await geocoder.geocode({
    location: { lat: coords.latitude, lng: coords.longitude }
  });
  const result = response.results?.[0];

  if (!result) {
    return {
      label: "Near me",
      town: "",
      province: ""
    };
  }

  const town = placeTown(result);
  const province = placeProvince(result);
  const label = [town, province].filter(Boolean).join(", ") || result.formatted_address || "Near me";

  return {
    label,
    town,
    province
  };
}
