"use client";

import { Bell, ChevronDown, Menu, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type DashboardHeaderProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onMenuClick: () => void;
  username: string;
};

export function DashboardHeader({
  searchQuery,
  onSearchChange,
  onMenuClick,
  username,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#e8ebf0] bg-white/95 backdrop-blur">
      <div className="flex h-[74px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
        <div className="flex items-center gap-3">
          <button
            className="rounded-lg p-2 text-[#667085] hover:bg-[#f2f4f7] lg:hidden"
            onClick={onMenuClick}
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-[10px] bg-[#246bfe] text-lg font-bold text-white shadow-[0_5px_12px_rgba(36,107,254,0.2)]">
              C
            </div>
            <span className="text-[17px] font-semibold tracking-[-0.02em] text-[#182230]">
              CloudBox
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          <label className="relative hidden w-[min(34vw,360px)] sm:block">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[17px] -translate-y-1/2 text-[#98a2b3]" />
            <input
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search files and folders..."
              className="h-10 w-full rounded-lg border border-[#e1e6ed] bg-[#fafbfc] pl-10 pr-4 text-sm text-[#344054] outline-none transition placeholder:text-[#98a2b3] focus:border-[#8db2ff] focus:bg-white focus:ring-3 focus:ring-[#246bfe]/10"
            />
          </label>
          <button
            className="relative rounded-lg p-2 text-[#667085] transition hover:bg-[#f2f4f7]"
            aria-label="Notifications"
          >
            <Bell className="size-[19px]" />
            <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-[#f04438] ring-2 ring-white" />
          </button>
          <button
            className="flex items-center gap-2 rounded-lg p-1.5 transition hover:bg-[#f6f8fa]"
            aria-label="Open account menu"
          >
            <Avatar className="size-8 bg-[#dce9ff] text-[#246bfe]">
              <AvatarFallback className="bg-[#dce9ff] text-xs font-semibold text-[#246bfe]">
                SM
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-left md:block">
              <span className="block text-sm font-medium text-[#344054]">
                {username}
              </span>
            </span>
            <ChevronDown className="hidden size-4 text-[#98a2b3] md:block" />
          </button>
        </div>
      </div>
      <div className="px-5 pb-3 sm:hidden">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#98a2b3]" />
          <input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search files and folders..."
            className="h-9 w-full rounded-lg border border-[#e1e6ed] bg-[#fafbfc] pl-9 pr-3 text-sm outline-none focus:border-[#8db2ff]"
          />
        </label>
      </div>
    </header>
  );
}
