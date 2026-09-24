"use client";

import { padHm } from "@/lib/availability";
import { formatTime12 } from "@/lib/booking-message";

const OPTIONS = Array.from({ length: 24 * 4 }, (_, i) => padHm(i * 15));

export function Time12Select({
  value,
  disabled,
  onChange,
  className = "rounded-xl border border-line px-3 py-2",
}: {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  className?: string;
}) {
  const options = value && !OPTIONS.includes(value) ? [value, ...OPTIONS] : OPTIONS;
  return (
    <select className={className} disabled={disabled} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((t) => (
        <option key={t} value={t}>
          {formatTime12(t)}
        </option>
      ))}
    </select>
  );
}
