"use client";

import { useMemo } from "react";

export function StableFormToken({ name = "clientRequestId" }: { name?: string }) {
  const token = useMemo(() => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }, []);

  return <input type="hidden" name={name} value={token} />;
}
