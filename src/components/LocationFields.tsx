"use client";

import { useMemo, useState } from "react";
import { southAfricanProvinces, townsForProvince, publicLocation } from "@/lib/location-options";

type LocationFieldsProps = {
  provinceName?: string;
  townName?: string;
  approximateName?: string;
  defaultProvince?: string | null;
  defaultTown?: string | null;
  defaultApproximate?: string | null;
  required?: boolean;
  showApproximate?: boolean;
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
  defaultProvince,
  defaultTown,
  defaultApproximate,
  required = false,
  showApproximate = true
}: LocationFieldsProps) {
  const [province, setProvince] = useState(defaultProvince ?? "");
  const [town, setTown] = useState(defaultTown ?? "");
  const [approximate, setApproximate] = useState(defaultApproximate ?? publicLocation(defaultTown, defaultProvince));
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
    </>
  );
}
