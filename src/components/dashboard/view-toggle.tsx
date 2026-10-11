"use client";

import { Grid2X2, List } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type DashboardView = "grid" | "list";

type ViewToggleProps = {
  value: DashboardView;
  onChange: (value: DashboardView) => void;
};

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(nextValue) => nextValue[0] && onChange(nextValue[0] as DashboardView)}
      aria-label="Change file view"
      variant="outline"
      size="sm"
    >
      {[
        { value: "grid" as const, label: "Grid view", Icon: Grid2X2 },
        { value: "list" as const, label: "List view", Icon: List },
      ].map(({ value: option, label, Icon }) => (
        <ToggleGroupItem
          key={option}
          aria-label={label}
          value={option}
        >
          <Icon />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
