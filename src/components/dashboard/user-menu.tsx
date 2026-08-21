"use client";

import { LogOut, Settings, User } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserMenuProps = {
  name?: string;
  email?: string;
};

export function UserMenu({
  name = "Alex Morgan",
  email = "alex@example.com",
}: UserMenuProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="h-auto gap-3 px-2 py-1.5 hover:bg-white/10"
            aria-label="Open user menu"
          />
        }
      >
        <Avatar className="size-8 bg-sky-300/15 text-sky-200">
          <AvatarFallback className="bg-sky-300/15 text-xs font-semibold text-sky-200">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-medium text-white">{name}</span>
          <span className="block max-w-36 truncate text-xs text-slate-400">
            {email}
          </span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 border-white/10 bg-[#11161e]"
      >
        <DropdownMenuLabel className="px-2 py-2">
          <span className="block truncate text-sm text-white">{name}</span>
          <span className="block truncate text-xs font-normal text-slate-400">
            {email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem className="gap-2 text-slate-200">
          <User className="size-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 text-slate-200">
          <Settings className="size-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem variant="destructive" className="gap-2">
          <LogOut className="size-4" />
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
