"use client";

import {
  Archive,
  File,
  Folder,
  Image,
  LayoutGrid,
  PlaySquare,
  Share2,
  X,
} from "lucide-react";

const navigation = [
  { label: "All Files", icon: LayoutGrid, category: "all" },
  { label: "Media", icon: PlaySquare, category: "media" },
  { label: "Docs", icon: File, category: "docs" },
  { label: "Images", icon: Image, category: "images" },
  { label: "Others", icon: Archive, category: "others" },
  { label: "Shared with me", icon: Share2, category: null },
] as const;

const storage = [
  ["Images", "2.4 GB", "bg-[#8b5cf6]"],
  ["Media", "8.2 GB", "bg-[#246bfe]"],
  ["Docs", "1.8 GB", "bg-[#f59e0b]"],
  ["Free Storage", "7.6 GB", "bg-[#dfe4eb]"],
];
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
        <button
          className="absolute right-4 top-5 rounded-lg p-2 text-[#667085] hover:bg-[#f2f4f7] lg:hidden"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <X className="size-5" />
        </button>
        <nav aria-label="File navigation" className="space-y-1">
          {navigation.map(({ label, icon: Icon, category }) => {
            const isActive = category !== null && activeCategory === category;

            return (
              <button
                key={label}
                disabled={category === null}
                onClick={() => {
                  if (category) {
                    onCategoryChange(category);
                    onClose();
                  }
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-[#edf4ff] text-[#246bfe]"
                    : category === null
                      ? "cursor-not-allowed text-[#98a2b3]"
                      : "text-[#667085] hover:bg-[#f7f9fc] hover:text-[#344054]"
                }`}
              >
                <Icon
                  className="size-[18px]"
                  strokeWidth={isActive ? 2.3 : 1.8}
                />

                {label}
              </button>
            );
          })}
        </nav>
        <div className="my-7 h-px bg-[#edf0f3]" />
        <section className="mt-auto rounded-xl bg-[#f8fafc] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#344054]">Storage</h2>
            <span className="text-xs font-medium text-[#246bfe]">72%</span>
          </div>
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-[#e6ebf2]">
            <div className="h-full w-[72%] rounded-full bg-[#246bfe]" />
          </div>
          <div className="space-y-3">
            {storage.map(([label, amount, color]) => (
              <div key={label} className="flex items-center gap-2 text-xs">
                <span className={`size-2 rounded-full ${color}`} />
                <span className="flex-1 text-[#667085]">{label}</span>
                <span className="font-medium text-[#475467]">{amount}</span>
              </div>
            ))}
          </div>
        </section>
        <p className="mt-5 px-1 text-[11px] leading-5 text-[#98a2b3]">
          14.4 GB of 20 GB used
        </p>
      </aside>
    </>
  );
}
