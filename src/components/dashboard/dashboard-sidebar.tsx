"use client";

import {
  Archive,
  File,
  Image,
  LayoutGrid,
  PlaySquare,
  Share2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navigation = [
  { label: "All Files", icon: LayoutGrid, category: "all" },
  { label: "Media", icon: PlaySquare, category: "media" },
  { label: "Docs", icon: File, category: "docs" },
  { label: "Images", icon: Image, category: "images" },
  { label: "Others", icon: Archive, category: "others" },
  { label: "Shared with me", icon: Share2, category: null },
] as const;

type FileCategory = "all" | "media" | "docs" | "images" | "others";
type DashboardSidebarProps = {
  open: boolean;
  onClose: () => void;
  activeCategory: FileCategory;
  onCategoryChange: (category: FileCategory) => void;
};

export function DashboardSidebar({
  open,
  onClose,
  activeCategory,
  onCategoryChange,
}: DashboardSidebarProps) {
  return (
    <>
      {open && (
        <button
          className="fixed inset-0 z-40 bg-[#182230]/25 lg:hidden"
          onClick={onClose}
          aria-label="Close navigation"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col border-r border-[#e8ebf0] bg-white px-4 pb-6 pt-[92px] transition-transform lg:sticky lg:top-0 lg:z-10 lg:h-[calc(100vh-74px)] lg:translate-x-0 lg:pt-7 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-5 lg:hidden"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <X />
        </Button>
        <nav aria-label="File navigation" className="flex flex-col gap-1">
          {navigation.map(({ label, icon: Icon, category }) => {
            const isActive = category !== null && activeCategory === category;

            return (
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className="w-full justify-start gap-3"
                key={label}
                disabled={category === null}
                onClick={() => {
                  if (category) {
                    onCategoryChange(category);
                    onClose();
                  }
                }}
              >
                <Icon strokeWidth={isActive ? 2.3 : 1.8} />

                {label}
              </Button>
            );
          })}
        </nav>
        <Separator className="my-7" />
        <section className="mt-auto rounded-xl bg-muted/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Storage</h2>
            <span className="text-xs text-muted-foreground">Overview</span>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            Storage details are managed by your account and will appear here when available.
          </p>
        </section>
      </aside>
    </>
  );
}
