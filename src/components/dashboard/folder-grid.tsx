"use client";

import { Folder, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const folders = [
  "UI/UX Design",
  "Legal Docs",
  "Reports",
  "Presentations",
  "Documents",
  "Template",
  "Important",
  "Meetings",
  "Resources",
  "Client Files",
];

export function FolderGrid({ query }: { query: string }) {
  const filteredFolders = folders.filter((folder) =>
    folder.toLowerCase().includes(query),
  );
  return (
    <section aria-labelledby="folders-heading" className="mb-9">
      <div className="mb-4 flex items-center justify-between">
        <h2
          id="folders-heading"
          className="text-[17px] font-semibold text-[#1d2939]"
        >
          My Folders
        </h2>
        <button className="text-sm font-medium text-[#246bfe] hover:text-[#155eef]">
          View all <span aria-hidden="true">→</span>
        </button>
      </div>
      {filteredFolders.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(205px,1fr))] gap-3">
          {filteredFolders.map((folder) => (
            <div
              key={folder}
              className="group flex h-[66px] items-center gap-3 rounded-lg border border-[#e4e8ee] bg-white px-3.5 transition hover:border-[#b8cdf7] hover:bg-[#fbfdff] hover:shadow-[0_4px_12px_rgba(25,65,125,0.06)]"
            >
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#edf4ff] text-[#246bfe]">
                <Folder className="size-[18px] fill-[#cfe0ff]" />
              </div>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#344054]">
                {folder}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      className="rounded-md p-1 text-[#98a2b3] opacity-0 transition hover:bg-[#f2f4f7] hover:text-[#475467] group-hover:opacity-100"
                      aria-label={`Actions for ${folder}`}
                    />
                  }
                >
                  <MoreHorizontal className="size-[18px]" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  <DropdownMenuItem>Rename</DropdownMenuItem>
                  <DropdownMenuItem>Share</DropdownMenuItem>
                  <DropdownMenuItem>Move</DropdownMenuItem>
                  <DropdownMenuItem variant="destructive">
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-[#d7dee8] bg-white px-4 py-8 text-center text-sm text-[#98a2b3]">
          No folders match your search.
        </p>
      )}
    </section>
  );
}
