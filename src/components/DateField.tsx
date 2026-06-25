"use client";

import type { InputHTMLAttributes } from "react";

type DateFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function DateField({ onChange, ...props }: DateFieldProps) {
  return (
    <input
      {...props}
      type="date"
      onChange={(event) => {
        onChange?.(event);
        event.currentTarget.blur();
      }}
    />
  );
}
