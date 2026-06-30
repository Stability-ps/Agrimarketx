"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps, placeCoordinates, placeProvince, placeTown } from "@/lib/google-maps";

export type PlaceSelection = {
  label: string;
  town: string;
  province: string;
  latitude?: number;
  longitude?: number;
};

export function GooglePlaceInput({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Search town or city"
}: {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (place: PlaceSelection) => void;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function setupAutocomplete() {
      try {
        const google = await loadGoogleMaps();

        if (cancelled || !inputRef.current || autocompleteRef.current) {
          return;
        }

        autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: "za" },
          fields: ["address_components", "formatted_address", "geometry", "name"],
          types: ["(cities)"]
        });

        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current?.getPlace();
          const coords = placeCoordinates(place);
          const town = placeTown(place);
          const province = placeProvince(place);
          const label = [town, province].filter(Boolean).join(", ") || place?.formatted_address || value;

          onPlaceSelect({
            label,
            town,
            province,
            latitude: coords?.latitude,
            longitude: coords?.longitude
          });
        });
      } catch {
        if (!cancelled) {
          setStatus("Map unavailable. You can still choose your town or city manually.");
        }
      }
    }

    setupAutocomplete();

    return () => {
      cancelled = true;
    };
  }, [onPlaceSelect, value]);

  return (
    <>
      <input
        ref={inputRef}
        className="field mt-1"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {status ? <span className="mt-1 block text-xs font-semibold text-slate-500">{status}</span> : null}
    </>
  );
}
