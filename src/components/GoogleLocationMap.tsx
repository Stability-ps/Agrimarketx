"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/google-maps";

export function GoogleLocationMap({
  latitude,
  longitude,
  onPick,
  heightClass = "h-40"
}: {
  latitude?: string | number | null;
  longitude?: string | number | null;
  onPick?: (coords: { latitude: number; longitude: number }) => void;
  heightClass?: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<any>(null);
  const [status, setStatus] = useState("");
  const lat = Number(latitude);
  const lng = Number(longitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  useEffect(() => {
    let cancelled = false;

    async function renderMap() {
      if (!mapRef.current || !hasCoords) {
        return;
      }

      try {
        const google = await loadGoogleMaps();
        if (cancelled || !mapRef.current) {
          return;
        }

        const center = { lat, lng };
        const map = new google.maps.Map(mapRef.current, {
          center,
          zoom: 12,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false
        });

        markerRef.current = new google.maps.Marker({
          position: center,
          map
        });

        if (onPick) {
          map.addListener("click", (event: any) => {
            const next = event.latLng;
            if (!next) {
              return;
            }

            const coords = {
              latitude: Number(next.lat().toFixed(7)),
              longitude: Number(next.lng().toFixed(7))
            };
            markerRef.current?.setPosition({ lat: coords.latitude, lng: coords.longitude });
            onPick(coords);
          });
        }
      } catch {
        if (!cancelled) {
          setStatus("Map unavailable. You can still choose your town or city manually.");
        }
      }
    }

    renderMap();

    return () => {
      cancelled = true;
    };
  }, [hasCoords, lat, lng, onPick]);

  if (!hasCoords) {
    return (
      <div className={`grid ${heightClass} place-items-center px-4 text-center text-sm font-semibold text-slate-600`}>
        Choose your town or city to preview the area.
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={mapRef} className={`${heightClass} w-full`} />
      {status ? <div className="absolute inset-0 grid place-items-center bg-white/85 px-4 text-center text-sm font-semibold text-slate-600">{status}</div> : null}
    </div>
  );
}
