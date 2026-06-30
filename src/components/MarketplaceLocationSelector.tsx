"use client";

import { MapPin, Navigation, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GoogleLocationMap } from "@/components/GoogleLocationMap";
import { GooglePlaceInput, type PlaceSelection } from "@/components/GooglePlaceInput";
import { allKnownLocations, nearestKnownLocation, radiusOptions } from "@/lib/location-distance";
import { createClient } from "@/lib/supabase/client";

type RecentLocation = {
  label: string;
  latitude?: number;
  longitude?: number;
  radius?: string;
};

function recentLocations() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    return JSON.parse(window.localStorage.getItem("agrimarketx_recent_locations") ?? "[]").slice(0, 5) as RecentLocation[];
  } catch {
    return [];
  }
}

function saveRecentLocation(location: RecentLocation) {
  if (typeof window === "undefined") {
    return;
  }

  const next = [
    location,
    ...recentLocations().filter((item) => item.label.toLowerCase() !== location.label.toLowerCase())
  ].slice(0, 5);
  window.localStorage.setItem("agrimarketx_recent_locations", JSON.stringify(next));
}

export function MarketplaceLocationSelector({
  location = "",
  latitude,
  longitude,
  radius = "all"
}: {
  location?: string;
  latitude?: string;
  longitude?: string;
  radius?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [locationText, setLocationText] = useState(location);
  const [selectedRadius, setSelectedRadius] = useState(radius || "all");
  const [status, setStatus] = useState("");
  const [recent, setRecent] = useState<RecentLocation[]>([]);
  const [draftLatitude, setDraftLatitude] = useState(latitude ?? "");
  const [draftLongitude, setDraftLongitude] = useState(longitude ?? "");
  const [profileFallback, setProfileFallback] = useState<RecentLocation | null>(null);
  const knownLocations = useMemo(() => allKnownLocations().filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude)), []);
  const suggestions = locationText.trim()
    ? knownLocations
        .filter((item) => `${item.town} ${item.province}`.toLowerCase().includes(locationText.trim().toLowerCase()))
        .slice(0, 6)
    : [];
  const label = location || (latitude && longitude ? "your area" : "All South Africa");

  useEffect(() => {
    setLocationText(location);
    setSelectedRadius(radius || "all");
    setDraftLatitude(latitude ?? "");
    setDraftLongitude(longitude ?? "");
  }, [latitude, location, longitude, radius]);

  useEffect(() => {
    let mounted = true;

    async function loadPreferredLocation() {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();

        if (!data.user) {
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("preferred_location, preferred_latitude, preferred_longitude, preferred_location_radius")
          .eq("id", data.user.id)
          .maybeSingle();

        if (!mounted || !profile?.preferred_location) {
          return;
        }

        setProfileFallback({
          label: profile.preferred_location,
          latitude: profile.preferred_latitude ? Number(profile.preferred_latitude) : undefined,
          longitude: profile.preferred_longitude ? Number(profile.preferred_longitude) : undefined,
          radius: profile.preferred_location_radius ?? "25"
        });
      } catch {
        // Older databases may not have preference columns yet.
      }
    }

    loadPreferredLocation();

    return () => {
      mounted = false;
    };
  }, []);

  function openPicker() {
    setRecent(recentLocations());
    setOpen(true);
  }

  async function savePreferredLocation(next: { label: string; latitude?: number; longitude?: number; radius?: string }) {
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        return;
      }

      await supabase
        .from("profiles")
        .update({
          preferred_location: next.label,
          preferred_latitude: next.latitude ?? null,
          preferred_longitude: next.longitude ?? null,
          preferred_location_radius: next.radius ?? selectedRadius
        })
        .eq("id", data.user.id);
    } catch {
      // Profile location persistence is helpful, but browsing should keep working if the DB is not migrated yet.
    }
  }

  function applyLocation(next: { label: string; latitude?: number; longitude?: number; radius?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    params.set("location", next.label);
    params.set("radius", next.radius ?? selectedRadius);

    if (next.latitude !== undefined && next.longitude !== undefined) {
      params.set("lat", String(next.latitude));
      params.set("lng", String(next.longitude));
    } else {
      params.delete("lat");
      params.delete("lng");
    }

    saveRecentLocation(next);
    void savePreferredLocation(next);
    setRecent(recentLocations());
    setOpen(false);
    router.push(`/marketplace?${params.toString()}` as never);
  }

  function clearLocation() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("location");
    params.delete("radius");
    params.delete("lat");
    params.delete("lng");
    params.delete("page");
    setOpen(false);
    router.push(`/marketplace${params.toString() ? `?${params.toString()}` : ""}` as never);
  }

  const requestCurrentLocation = useCallback((options?: { keepOpen?: boolean; silent?: boolean }) => {
    if (!navigator.geolocation) {
      setStatus("Location is not supported on this device.");
      return;
    }

    setStatus(options?.silent ? "" : "Finding your location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: Number(position.coords.latitude.toFixed(7)),
          longitude: Number(position.coords.longitude.toFixed(7))
        };
        const nearest = nearestKnownLocation(coords);
        const nextLabel = nearest ? `${nearest.town}, ${nearest.province}` : "Near me";
        setLocationText(nextLabel);
        setDraftLatitude(String(coords.latitude));
        setDraftLongitude(String(coords.longitude));

        if (options?.keepOpen) {
          setStatus(nearest ? `Matched nearest area: ${nextLabel}` : "Location detected.");
          return;
        }

        applyLocation({ label: nextLabel, ...coords, radius: selectedRadius === "all" ? "25" : selectedRadius });
      },
      () => {
        if (profileFallback && !location && !latitude && !longitude) {
          applyLocation(profileFallback);
          return;
        }

        setStatus(options?.silent ? "" : "Could not access your location. You can still choose a town manually.");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, [latitude, location, longitude, profileFallback, selectedRadius]);

  useEffect(() => {
    if (typeof window === "undefined" || location || latitude || longitude) {
      return;
    }

    const asked = window.localStorage.getItem("agrimarketx_location_permission_asked");
    if (asked || !navigator.geolocation) {
      return;
    }

    window.localStorage.setItem("agrimarketx_location_permission_asked", "true");
    const timer = window.setTimeout(() => requestCurrentLocation({ silent: true }), 900);
    return () => window.clearTimeout(timer);
  }, [latitude, location, longitude, requestCurrentLocation]);

  function selectPlace(place: PlaceSelection) {
    setLocationText(place.label);
    setDraftLatitude(place.latitude !== undefined ? String(place.latitude) : "");
    setDraftLongitude(place.longitude !== undefined ? String(place.longitude) : "");
  }

  function pickMapLocation(coords: { latitude: number; longitude: number }) {
    const nearest = nearestKnownLocation(coords);
    const nextLabel = nearest ? `${nearest.town}, ${nearest.province}` : "Near me";
    setLocationText(nextLabel);
    setDraftLatitude(String(coords.latitude));
    setDraftLongitude(String(coords.longitude));
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <button
          type="button"
          className="flex min-h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full bg-green-50 px-3 text-xs font-bold text-brand-green transition active:scale-95 lg:justify-start"
          onClick={openPicker}
        >
          <MapPin size={15} />
          Showing listings near <span className="truncate">{label}</span>
        </button>
        <button
          type="button"
          className="min-h-9 rounded-full bg-brand-green px-3 text-xs font-black text-white shadow-sm transition active:scale-95"
          onClick={() => requestCurrentLocation()}
        >
          Near Me
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[70] bg-white p-4 pt-[calc(env(safe-area-inset-top)+1rem)] text-brand-navy lg:absolute lg:inset-auto lg:right-0 lg:top-[calc(100%+0.5rem)] lg:w-[420px] lg:rounded-xl lg:border lg:border-slate-200 lg:p-4 lg:shadow-soft">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Choose location</h2>
              <p className="text-sm text-slate-600">Find listings near your town or current GPS area.</p>
            </div>
            <button type="button" className="grid h-10 w-10 place-items-center rounded-full bg-slate-100" onClick={() => setOpen(false)} aria-label="Close location picker">
              <X size={18} />
            </button>
          </div>

          <button type="button" className="primary-button w-full" onClick={() => requestCurrentLocation({ keepOpen: true })}>
            <Navigation size={17} />
            Use my location
          </button>
          {status ? <p className="mt-2 text-sm font-semibold text-slate-600">{status}</p> : null}

          <label className="mt-4 block">
            <span className="text-sm font-semibold">Radius</span>
            <select className="field mt-1" value={selectedRadius} onChange={(event) => setSelectedRadius(event.target.value)}>
              {radiusOptions.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          <label className="mt-3 block">
            <span className="text-sm font-semibold">Search province, town or city</span>
            <GooglePlaceInput
              value={locationText}
              onChange={setLocationText}
              onPlaceSelect={selectPlace}
              placeholder="e.g. Pretoria, Nigel, Polokwane"
            />
          </label>

          <div className="mt-3 grid gap-2">
            {suggestions.map((item) => (
              <button
                key={`${item.town}-${item.province}`}
                type="button"
                className="rounded-md border border-slate-200 px-3 py-2 text-left text-sm font-bold hover:border-brand-green"
                onClick={() => {
                  setDraftLatitude(String(item.latitude));
                  setDraftLongitude(String(item.longitude));
                  applyLocation({ label: `${item.town}, ${item.province}`, latitude: item.latitude, longitude: item.longitude, radius: selectedRadius });
                }}
              >
                {item.town}, {item.province}
              </button>
            ))}
          </div>

          {recent.length > 0 ? (
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Recent locations</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {recent.map((item) => (
                  <button key={item.label} type="button" className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700" onClick={() => applyLocation(item)}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            <GoogleLocationMap latitude={draftLatitude} longitude={draftLongitude} onPick={pickMapLocation} heightClass="h-44" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" className="secondary-button" onClick={clearLocation}>All South Africa</button>
            <button
              type="button"
              className="primary-button"
              onClick={() => applyLocation({
                label: locationText.trim() || "All South Africa",
                latitude: draftLatitude ? Number(draftLatitude) : undefined,
                longitude: draftLongitude ? Number(draftLongitude) : undefined,
                radius: selectedRadius
              })}
            >
              Apply
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
