"use client";

import { Grid2X2, List } from "lucide-react";

export type DashboardView = "grid" | "list";

type ViewToggleProps = {
  value: DashboardView;
  onChange: (value: DashboardView) => void;
};

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div
      className="flex items-center rounded-lg border border-[#e1e6ed] bg-white p-1"
      aria-label="Change file view"
      role="group"
    >
      {[
        { value: "grid" as const, label: "Grid view", Icon: Grid2X2 },
        { value: "list" as const, label: "List view", Icon: List },
      ].map(({ value: option, label, Icon }) => (
        <button
          key={option}
          type="button"
          aria-label={label}
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={`rounded-md p-1.5 transition ${
            value === option
              ? "bg-[#edf4ff] text-[#246bfe]"
              : "text-[#98a2b3] hover:bg-[#f2f4f7] hover:text-[#475467]"
          }`}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  );
}
