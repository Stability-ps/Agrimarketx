"use client";

import { useFormStatus } from "react-dom";

export function FormSubmitButton({
  label,
  pendingLabel,
  className = "primary-button"
}: {
  label: string;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button className={className} type="submit" disabled={pending} aria-disabled={pending}>
      {pending ? pendingLabel ?? "Saving..." : label}
    </button>
  );
}
