"use client";

import { Bell, ChevronDown, Menu, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/ui/mode-toggle";

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
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="flex h-[74px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
            aria-label="Open navigation"
          >
            <Menu />
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-[10px] bg-primary text-lg font-bold text-primary-foreground">
              C
            </div>
            <span className="text-[17px] font-semibold tracking-[-0.02em]">
              CloudBox
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          <label className="relative hidden w-[min(34vw,360px)] sm:block">
            <Search data-icon="inline-start" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search files and folders..."
              className="h-10 w-full bg-muted/30 pl-10"
            />
          </label>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Notifications"
          >
            <Bell />
            <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-destructive ring-2 ring-background" />
          </Button>
          <ModeToggle />
          <Button
            variant="ghost"
            className="h-auto gap-2 p-1.5"
            aria-label="Open account menu"
          >
            <Avatar className="size-8 bg-primary/10 text-primary">
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-left md:block">
              <span className="block text-sm font-medium">{username}</span>
            </span>
            <ChevronDown className="hidden text-muted-foreground md:block" />
          </Button>
        </div>
      </div>
      <div className="px-5 pb-3 sm:hidden">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search files and folders..."
            className="h-9 w-full bg-muted/30 pl-9"
          />
        </label>
      </div>
    </header>
  );
}
