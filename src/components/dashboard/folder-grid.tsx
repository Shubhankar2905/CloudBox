"use client";

import { useState } from "react";
import { Folder, MoreHorizontal, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type FolderItem = {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
};

type FolderGridProps = {
  query: string;
  folders: FolderItem[];
  onFolderCreated: (folder: FolderItem) => void;
};

export function FolderGrid({
  query,
  folders,
  onFolderCreated,
}: FolderGridProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const filteredFolders = folders.filter((folder) =>
    folder.name.toLowerCase().includes(query.toLowerCase()),
  );

  async function createFolder() {
    const trimmedName = folderName.trim();

    if (!trimmedName) {
      setError("Folder name is required");
      return;
    }

    try {
      setCreating(true);
      setError("");

      const response = await fetch("/api/folder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          parentId: null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to create folder");
        return;
      }

      // Add the complete folder object to DashboardShell state
      onFolderCreated(data.folder);

      // Reset form
      setFolderName("");
      setError("");
      setIsCreateOpen(false);
    } catch (error) {
      console.error("Create folder error:", error);
      setError("Something went wrong while creating the folder.");
    } finally {
      setCreating(false);
    }
  }

  function openCreateDialog() {
    setFolderName("");
    setError("");
    setIsCreateOpen(true);
  }

  function closeCreateDialog() {
    if (creating) return;

    setFolderName("");
    setError("");
    setIsCreateOpen(false);
  }

  return (
    <>
      <section aria-labelledby="folders-heading" className="mb-9">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2
            id="folders-heading"
            className="text-[17px] font-semibold text-[#1d2939]"
          >
            My Folders
          </h2>

          {/* CREATE FOLDER BUTTON */}
          <button
            type="button"
            onClick={openCreateDialog}
            className="flex items-center gap-1.5 rounded-lg bg-[#246bfe] px-3.5 py-2 text-sm font-medium text-white shadow-[0_5px_12px_rgba(36,107,254,0.2)] transition hover:bg-[#155eef]"
          >
            <Plus className="size-4" />
            New Folder
          </button>
        </div>

        {/* Folder Grid */}
        {filteredFolders.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(205px,1fr))] gap-3">
            {filteredFolders.map((folder) => (
              <div
                key={folder.id}
                className="group flex h-[66px] items-center gap-3 rounded-lg border border-[#e4e8ee] bg-white px-3.5 transition hover:border-[#b8cdf7] hover:bg-[#fbfdff] hover:shadow-[0_4px_12px_rgba(25,65,125,0.06)]"
              >
                {/* Folder Icon */}
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#edf4ff] text-[#246bfe]">
                  <Folder className="size-[18px] fill-[#cfe0ff]" />
                </div>

                {/* Folder Name */}
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#344054]">
                  {folder.name}
                </span>

                {/* Folder Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        type="button"
                        className="rounded-md p-1 text-[#98a2b3] opacity-0 transition hover:bg-[#f2f4f7] hover:text-[#475467] group-hover:opacity-100"
                        aria-label={`Actions for ${folder.name}`}
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

      {/* CREATE FOLDER DIALOG */}
      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeCreateDialog();
          } else {
            setIsCreateOpen(true);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create folder</DialogTitle>

            <DialogDescription>Give your new folder a name.</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <input
              autoFocus
              type="text"
              value={folderName}
              onChange={(event) => {
                setFolderName(event.target.value);
                setError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !creating) {
                  createFolder();
                }
              }}
              placeholder="e.g. College Projects"
              maxLength={255}
              className="w-full rounded-lg border border-[#d0d5dd] px-3 py-2.5 text-sm outline-none transition placeholder:text-[#98a2b3] focus:border-[#246bfe] focus:ring-2 focus:ring-[#246bfe]/10"
            />

            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={closeCreateDialog}
              disabled={creating}
              className="rounded-lg border border-[#d0d5dd] px-4 py-2 text-sm font-medium text-[#344054] transition hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={createFolder}
              disabled={creating || !folderName.trim()}
              className="rounded-lg bg-[#246bfe] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#155eef] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create folder"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
