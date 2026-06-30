"use client";

import { MapPin, Navigation } from "lucide-react";
import { useMemo, useState } from "react";
import { nearestKnownLocation } from "@/lib/location-distance";
import { southAfricanProvinces, townsForProvince, publicLocation } from "@/lib/location-options";

type LocationFieldsProps = {
  provinceName?: string;
  townName?: string;
  approximateName?: string;
  latitudeName?: string;
  longitudeName?: string;
  defaultProvince?: string | null;
  defaultTown?: string | null;
  defaultApproximate?: string | null;
  defaultLatitude?: string | number | null;
  defaultLongitude?: string | number | null;
  required?: boolean;
  showApproximate?: boolean;
  showMapPicker?: boolean;
};

export function ProvinceSelect({
  name = "province",
  defaultValue,
  required = false
}: {
  name?: string;
  defaultValue?: string | null;
  required?: boolean;
}) {
  return (
    <select className="field mt-1" name={name} defaultValue={defaultValue ?? ""} required={required}>
      <option value="">Select province</option>
      {southAfricanProvinces.map((province) => (
        <option key={province} value={province}>{province}</option>
      ))}
    </select>
  );
}

export function LocationFields({
  provinceName = "province",
  townName = "town",
  approximateName = "approximateLocation",
  latitudeName = "latitude",
  longitudeName = "longitude",
  defaultProvince,
  defaultTown,
  defaultApproximate,
  defaultLatitude,
  defaultLongitude,
  required = false,
  showApproximate = true,
  showMapPicker = true
}: LocationFieldsProps) {
  const [province, setProvince] = useState(defaultProvince ?? "");
  const [town, setTown] = useState(defaultTown ?? "");
  const [approximate, setApproximate] = useState(defaultApproximate ?? publicLocation(defaultTown, defaultProvince));
  const [latitude, setLatitude] = useState(defaultLatitude ? String(defaultLatitude) : "");
  const [longitude, setLongitude] = useState(defaultLongitude ? String(defaultLongitude) : "");
  const [status, setStatus] = useState("");
  const [manualApproximate, setManualApproximate] = useState(Boolean(defaultApproximate));
  const towns = useMemo(() => townsForProvince(province), [province]);
  const listId = `${townName}-suggestions`;

  function updateProvince(value: string) {
    setProvince(value);
    if (!manualApproximate) {
      setApproximate(publicLocation(town, value));
    }
  }

  function updateTown(value: string) {
    setTown(value);
    if (!manualApproximate) {
      setApproximate(publicLocation(value, province));
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setStatus("Location is not supported on this device.");
      return;
    }

    setStatus("Finding your location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLatitude = Number(position.coords.latitude.toFixed(7));
        const nextLongitude = Number(position.coords.longitude.toFixed(7));
        const nearest = nearestKnownLocation({ latitude: nextLatitude, longitude: nextLongitude });
        setLatitude(String(nextLatitude));
        setLongitude(String(nextLongitude));

        if (nearest) {
          setProvince(nearest.province);
          setTown(nearest.town);
          if (!manualApproximate) {
            setApproximate(publicLocation(nearest.town, nearest.province));
          }
        }

        setStatus(nearest ? `Matched nearest area: ${nearest.town}, ${nearest.province}` : "Location saved.");
      },
      () => setStatus("Could not access GPS. You can still set the town manually."),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }

  return (
    <>
      <label>
        <span className="text-sm font-semibold">Province</span>
        <select className="field mt-1" name={provinceName} value={province} onChange={(event) => updateProvince(event.target.value)} required={required}>
          <option value="">Select province</option>
          {southAfricanProvinces.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </label>
      <label>
        <span className="text-sm font-semibold">Town / city</span>
        <input
          className="field mt-1"
          name={townName}
          list={listId}
          value={town}
          onChange={(event) => updateTown(event.target.value)}
          placeholder={province ? "Start typing town or city" : "Select province first"}
        />
        <datalist id={listId}>
          {towns.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
      </label>
      {showApproximate ? (
        <label className="sm:col-span-2">
          <span className="text-sm font-semibold">Approximate public location</span>
          <input
            className="field mt-1"
            name={approximateName}
            value={approximate}
            onChange={(event) => {
              setManualApproximate(true);
              setApproximate(event.target.value);
            }}
            placeholder="Near Pretoria, Gauteng"
          />
          <span className="mt-1 block text-xs text-slate-500">This is what buyers see publicly. Keep exact GPS/private address hidden.</span>
        </label>
      ) : null}
      {showMapPicker ? (
        <div className="sm:col-span-2 rounded-md border border-slate-200 bg-slate-50 p-3">
          <input type="hidden" name={latitudeName} value={latitude} />
          <input type="hidden" name={longitudeName} value={longitude} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-1 text-sm font-bold text-brand-navy"><MapPin size={16} /> Map location</p>
              <p className="mt-1 text-xs text-slate-500">Exact GPS is stored privately. Buyers only see the approximate public location.</p>
            </div>
            <button type="button" className="secondary-button min-h-9 px-3 py-1 text-xs" onClick={useCurrentLocation}>
              <Navigation size={15} />
              Use my location
            </button>
          </div>
          {status ? <p className="mt-2 text-xs font-semibold text-slate-600">{status}</p> : null}
          <div className="mt-3 overflow-hidden rounded-md border border-slate-200 bg-white">
            {latitude && longitude ? (
              <iframe
                title="Listing location map preview"
                className="h-40 w-full"
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(longitude) - 0.08}%2C${Number(latitude) - 0.08}%2C${Number(longitude) + 0.08}%2C${Number(latitude) + 0.08}&layer=mapnik&marker=${latitude}%2C${longitude}`}
              />
            ) : (
              <div className="grid h-28 place-items-center px-4 text-center text-sm font-semibold text-slate-600">Use GPS or choose a town to set the listing area.</div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
