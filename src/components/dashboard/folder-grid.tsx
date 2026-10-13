"use client";

import { useState } from "react";
import { ChevronRight, Folder, Home, MoreHorizontal, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toast";
import { Button } from "../ui/button";

export type FolderItem = {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
};

type FolderGridProps = {
  query: string;
  folders: FolderItem[];
  currentFolderId: string | null;
  onNavigate: (folderId: string | null) => void;
  onFolderCreated: (folder: FolderItem) => void;
  onRenameFolder: (folder: FolderItem) => void;
  onDeleteFolder: (folder: FolderItem) => void;
  showFolders?: boolean;
};

export function FolderGrid({
  query,
  folders,
  currentFolderId,
  onNavigate,
  onFolderCreated,
  onRenameFolder,
  onDeleteFolder,
  showFolders = true,
}: FolderGridProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [creating, setCreating] = useState(false);

  const visibleFolders = folders
    .filter((folder) => folder.parentId === currentFolderId)
    .filter((folder) =>
      folder.name.toLowerCase().includes(query.toLowerCase()),
    );

  const breadcrumbs: FolderItem[] = [];
  let parentId = currentFolderId;
  while (parentId) {
    const folder = folders.find((item) => item.id === parentId);
    if (!folder) break;
    breadcrumbs.unshift(folder);
    parentId = folder.parentId;
  }

  async function createFolder() {
    const trimmedName = folderName.trim();
    if (!trimmedName) {
      toast.add({
        id: "dashboard-create-folder",
        type: "error",
        title: "Folder creation failed",
        description: "A folder name is required.",
      });
      return;
    }

    try {
      setCreating(true);
      const response = await fetch("/api/folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, parentId: currentFolderId }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.add({
          id: "dashboard-create-folder",
          type: "error",
          title: "Folder creation failed",
          description: data.message || "Please try again.",
        });
        return;
      }
      onFolderCreated(data.folder);
      setFolderName("");
      setIsCreateOpen(false);
      toast.add({
        id: "dashboard-create-folder",
        type: "success",
        title: "Folder created",
        description: `${trimmedName} was created successfully.`,
      });
    } catch (createError) {
      console.error("Create folder error:", createError);
      toast.add({
        id: "dashboard-create-folder",
        type: "error",
        title: "Folder creation failed",
        description: "Something went wrong while creating the folder.",
      });
    } finally {
      setCreating(false);
    }
  }

  function closeCreateDialog() {
    if (creating) return;
    setFolderName("");
    setIsCreateOpen(false);
  }

  return (
    <>
      <section aria-labelledby="folders-heading" className="mb-9">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2
              id="folders-heading"
              className="text-[17px] font-semibold text-[#1d2939]"
            >
              {currentFolderId ? "Folder contents" : "My Folders"}
            </h2>
            <nav
              aria-label="Folder path"
              className="mt-2 flex min-w-0 items-center gap-1 text-xs text-[#667085]"
            >
              <button
                type="button"
                onClick={() => onNavigate(null)}
                className="inline-flex items-center gap-1 hover:text-[#246bfe]"
              >
                <Home className="size-3.5" /> My Files
              </button>
              {breadcrumbs.map((folder) => (
                <span
                  key={folder.id}
                  className="flex min-w-0 items-center gap-1"
                >
                  <ChevronRight className="size-3.5 shrink-0 text-[#98a2b3]" />
                  <button
                    type="button"
                    onClick={() => onNavigate(folder.id)}
                    className="truncate hover:text-[#246bfe]"
                  >
                    {folder.name}
                  </button>
                </span>
              ))}
            </nav>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setFolderName("");
              setIsCreateOpen(true);
            }}
            className="flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium"
          >
            <Plus className="size-4" />
            New Folder
          </Button>
        </div>

        {showFolders && visibleFolders.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(205px,1fr))] gap-3">
            {visibleFolders.map((folder) => (
              <div
                key={folder.id}
                className="group flex h-[66px] items-center gap-3 rounded-lg border border-[#e4e8ee] bg-white px-3.5 transition hover:border-[#b8cdf7] hover:bg-[#fbfdff] hover:shadow-[0_4px_12px_rgba(25,65,125,0.06)]"
              >
                <button
                  type="button"
                  onClick={() => onNavigate(folder.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Folder className="size-[18px] fill-primary/20" />
                  </div>

                  <span className="truncate text-sm font-medium text-foreground">
                    {folder.name}
                  </span>
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        type="button"
                        className="rounded-md p-1 text-muted-foreground opacity-0 transition-colors hover:bg-accent hover:text-accent-foreground group-hover:opacity-100 focus-visible:opacity-100"
                        aria-label={`Actions for ${folder.name}`}
                      />
                    }
                  >
                    <MoreHorizontal className="size-[18px]" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    <DropdownMenuItem onClick={() => onNavigate(folder.id)}>
                      Open
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onRenameFolder(folder)}>
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => onDeleteFolder(folder)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        ) : showFolders ? (
          <p className="rounded-lg border border-dashed border-[#d7dee8] bg-white px-4 py-8 text-center text-sm text-[#98a2b3]">
            {query ? "No folders match your search." : "This folder is empty."}
          </p>
        ) : null}
      </section>

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => !open && closeCreateDialog()}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create folder</DialogTitle>
            <DialogDescription>
              Create a folder inside the current folder.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <input
              autoFocus
              type="text"
              value={folderName}
              onChange={(event) => {
                setFolderName(event.target.value);
              }}
              onKeyDown={(event) =>
                event.key === "Enter" && !creating && createFolder()
              }
              placeholder="e.g. College Projects"
              maxLength={255}
              className="w-full rounded-lg border border-[#d0d5dd] px-3 py-2.5 text-sm outline-none transition placeholder:text-[#98a2b3] focus:border-[#246bfe] focus:ring-2 focus:ring-[#246bfe]/10"
            />
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={closeCreateDialog}
              disabled={creating}
              className="rounded-lg border border-[#d0d5dd] px-4 py-2 text-sm font-medium text-[#344054] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={createFolder}
              disabled={creating || !folderName.trim()}
              className="rounded-lg bg-[#246bfe] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create folder"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
