"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { FolderGrid, type FolderItem } from "@/components/dashboard/folder-grid";
import { RecentFiles, type FileItem } from "@/components/dashboard/recent-files";
import { FileGrid } from "@/components/dashboard/file-grid";
import { ViewToggle, type DashboardView } from "@/components/dashboard/view-toggle";

type FileCategory = "all" | "media" | "docs" | "images" | "others";
type RenameTarget =
  | { type: "file"; item: FileItem }
  | { type: "folder"; item: FolderItem };

export function DashboardShell() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [username, setUsername] = useState("Loading...");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<FileCategory>("all");
  const [view, setView] = useState<DashboardView>("grid");
  const [renameTarget, setRenameTarget] = useState<RenameTarget | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RenameTarget | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [moveTarget, setMoveTarget] = useState<FileItem | null>(null);
  const [moveDestination, setMoveDestination] = useState("");
  const [moveError, setMoveError] = useState("");
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    async function fetchFiles() {
      try {
        const response = await fetch(
          `/api/file?folderId=${encodeURIComponent(currentFolderId || "")}`,
        );
        if (!response.ok) {
          console.error("Failed to fetch files");
          return;
        }
        const data = await response.json();
        setFiles(data.files);
      } catch (error) {
        console.error("Failed to fetch files:", error);
      }
    }
    fetchFiles();
  }, [currentFolderId]);

  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const response = await fetch("/api/me");
        if (!response.ok) return;
        const data = await response.json();
        if (data.user?.name) setUsername(data.user.name);
      } catch (error) {
        console.error("Failed to fetch current user:", error);
      }
    }
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    async function fetchFolders() {
      try {
        const response = await fetch("/api/folder?all=true");
        if (!response.ok) {
          console.error("Failed to fetch folders");
          return;
        }
        const data = await response.json();
        setFolders(data.folders);
      } catch (error) {
        console.error("Failed to fetch folders:", error);
      }
    }
    fetchFolders();
  }, []);

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (currentFolderId) formData.append("folderId", currentFolderId);
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) {
        console.error("Upload failed:", data.error);
        return;
      }
      setFiles((currentFiles) => [
        {
          id: data.file.id,
          name: data.file.name,
          size: data.file.size,
          mimeType: data.file.mimeType,
          createdAt: data.file.createdAt,
          folderId: data.file.folderId,
        },
        ...currentFiles,
      ]);
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      event.target.value = "";
    }
  }

  function openRename(type: "file" | "folder", item: FileItem | FolderItem) {
    setRenameTarget(type === "file" ? { type, item: item as FileItem } : { type, item: item as FolderItem });
    setRenameValue(item.name);
    setRenameError("");
  }

  async function renameItem() {
    if (!renameTarget || !renameValue.trim()) {
      setRenameError("A name is required.");
      return;
    }
    try {
      setRenaming(true);
      const response = await fetch(
        `/${renameTarget.type === "file" ? "api/file" : "api/folder"}/${renameTarget.item.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: renameValue.trim() }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        setRenameError(data.message || "Rename failed.");
        return;
      }
      if (renameTarget.type === "file") {
        setFiles((items) =>
          items.map((item) =>
            item.id === renameTarget.item.id ? { ...item, name: data.file.name } : item,
          ),
        );
      } else {
        setFolders((items) =>
          items.map((item) =>
            item.id === renameTarget.item.id
              ? { ...item, name: data.folder.name, updatedAt: data.folder.updatedAt }
              : item,
          ),
        );
      }
      setRenameTarget(null);
    } catch (error) {
      console.error("Rename error:", error);
      setRenameError("Something went wrong while renaming.");
    } finally {
      setRenaming(false);
    }
  }

  async function deleteItem() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const response = await fetch(
        `/${deleteTarget.type === "file" ? "api/file" : "api/folder"}/${deleteTarget.item.id}`,
        { method: "DELETE" },
      );
      const data = await response.json();
      if (!response.ok) {
        setDeleteError(data.message || "Delete failed.");
        return;
      }
      if (deleteTarget.type === "file") {
        setFiles((items) => items.filter((item) => item.id !== deleteTarget.item.id));
      } else {
        setFolders((items) => items.filter((item) => item.id !== deleteTarget.item.id));
      }
      setDeleteTarget(null);
    } catch (error) {
      console.error("Delete error:", error);
      setDeleteError("Something went wrong while deleting.");
    } finally {
      setDeleting(false);
    }
  }

  async function moveFile() {
    if (!moveTarget) return;
    try {
      setMoving(true);
      setMoveError("");
      const response = await fetch(`/api/file/${moveTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: moveDestination || null }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMoveError(data.message || "Move failed.");
        return;
      }
      setFiles((items) =>
        items
          .map((item) =>
            item.id === moveTarget.id ? { ...item, folderId: moveDestination || null } : item,
          )
          .filter((item) => item.folderId === currentFolderId),
      );
      setMoveTarget(null);
    } catch (error) {
      console.error("Move error:", error);
      setMoveError("Something went wrong while moving.");
    } finally {
      setMoving(false);
    }
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredFiles = files.filter((file) => {
    if (activeCategory === "images") return file.mimeType.startsWith("image/");
    if (activeCategory === "media") return file.mimeType.startsWith("video/") || file.mimeType.startsWith("audio/");
    if (activeCategory === "docs") {
      return file.mimeType === "application/pdf" || file.mimeType.includes("word") || file.mimeType.includes("document") || file.mimeType.includes("spreadsheet") || file.mimeType.startsWith("text/");
    }
    if (activeCategory === "others") {
      const image = file.mimeType.startsWith("image/");
      const media = file.mimeType.startsWith("video/") || file.mimeType.startsWith("audio/");
      const document = file.mimeType === "application/pdf" || file.mimeType.includes("word") || file.mimeType.includes("document") || file.mimeType.includes("spreadsheet") || file.mimeType.startsWith("text/");
      return !image && !media && !document;
    }
    return true;
  });
  const currentFolders = activeCategory === "all"
    ? folders.filter((folder) => folder.parentId === currentFolderId && folder.name.toLowerCase().includes(normalizedQuery))
    : [];
  const viewConfig = {
    all: { title: "My Workspace", description: "Manage your files and folders" },
    images: { title: "Images", description: "All your images" },
    media: { title: "Media", description: "All your media files" },
    docs: { title: "Docs", description: "All your documents" },
    others: { title: "Others", description: "Other files" },
  };

  const commonFileProps = {
    query: normalizedQuery,
    files: filteredFiles,
    folders: currentFolders,
    onNavigate: setCurrentFolderId,
    onRenameFile: (file: FileItem) => openRename("file", file),
    onDeleteFile: (file: FileItem) => {
      setDeleteError("");
      setDeleteTarget({ type: "file", item: file });
    },
    onRenameFolder: (folder: FolderItem) => openRename("folder", folder),
    onDeleteFolder: (folder: FolderItem) => {
      setDeleteError("");
      setDeleteTarget({ type: "folder", item: folder });
    },
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#1d2939]">
      <DashboardHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} onMenuClick={() => setSidebarOpen(true)} username={username} />
      <div className="flex">
        <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1480px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
            <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8491a5]">Workspace</p>
                <h1 className="text-[27px] font-semibold tracking-[-0.03em] text-[#182230]">{viewConfig[activeCategory].title}</h1>
                <p className="mt-1 text-sm text-[#8793a6]">{viewConfig[activeCategory].description}</p>
              </div>
              <div className="flex items-center gap-2">
                <ViewToggle value={view} onChange={setView} />
                <label className="cursor-pointer rounded-lg bg-[#246bfe] px-4 py-2.5 text-sm font-medium text-white">
                  <span>Upload file</span>
                  <input type="file" className="sr-only" onChange={handleFileUpload} />
                </label>
              </div>
            </div>

            {activeCategory === "all" && (
              <FolderGrid
                query={normalizedQuery}
                folders={folders}
                currentFolderId={currentFolderId}
                onNavigate={setCurrentFolderId}
                onFolderCreated={(folder) => setFolders((items) => [folder, ...items])}
                onRenameFolder={(folder) => openRename("folder", folder)}
                onDeleteFolder={(folder) => {
                  setDeleteError("");
                  setDeleteTarget({ type: "folder", item: folder });
                }}
                showFolders={view === "grid"}
              />
            )}

            {view === "grid" ? (
              <>
                <FileGrid
                  {...commonFileProps}
                  folders={[]}
                  onMoveFile={(file) => {
                    setMoveDestination(file.folderId || "");
                    setMoveError("");
                    setMoveTarget(file);
                  }}
                />
              </>
            ) : (
              <RecentFiles
                {...commonFileProps}
                onFileMoved={(fileId, folderId) =>
                  setFiles((items) =>
                    items
                      .map((file) => file.id === fileId ? { ...file, folderId } : file)
                      .filter((file) => file.folderId === currentFolderId),
                  )
                }
              />
            )}
          </div>
        </main>
      </div>

      <Dialog open={Boolean(renameTarget)} onOpenChange={(open) => !open && !renaming && setRenameTarget(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Rename {renameTarget?.type}</DialogTitle><DialogDescription>Enter a new name for this {renameTarget?.type}.</DialogDescription></DialogHeader>
          <input value={renameValue} onChange={(event) => setRenameValue(event.target.value)} maxLength={255} className="rounded-lg border border-[#d0d5dd] px-3 py-2.5 text-sm outline-none focus:border-[#246bfe]" />
          {renameError && <p className="text-sm text-red-500">{renameError}</p>}
          <DialogFooter>
            <button type="button" onClick={() => setRenameTarget(null)} disabled={renaming} className="rounded-lg border border-[#d0d5dd] px-4 py-2 text-sm">Cancel</button>
            <button type="button" onClick={renameItem} disabled={renaming || !renameValue.trim()} className="rounded-lg bg-[#246bfe] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{renaming ? "Saving..." : "Save"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Delete {deleteTarget?.type}?</DialogTitle><DialogDescription>This action cannot be undone. {deleteTarget?.type === "folder" && "Folders must be empty before they can be deleted."}</DialogDescription></DialogHeader>
          {deleteError && <p className="text-sm text-red-500">{deleteError}</p>}
          <DialogFooter>
            <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleting} className="rounded-lg border border-[#d0d5dd] px-4 py-2 text-sm">Cancel</button>
            <button type="button" onClick={deleteItem} disabled={deleting} className="rounded-lg bg-[#d92d20] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{deleting ? "Deleting..." : "Delete"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(moveTarget)} onOpenChange={(open) => !open && !moving && setMoveTarget(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Move file</DialogTitle><DialogDescription>Choose a destination for {moveTarget?.name}.</DialogDescription></DialogHeader>
          <select value={moveDestination} onChange={(event) => setMoveDestination(event.target.value)} className="rounded-lg border border-[#d0d5dd] bg-white px-3 py-2.5 text-sm">
            <option value="">My Files</option>
            {folders.filter((folder) => folder.id !== moveTarget?.folderId).map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
          </select>
          {moveError && <p className="text-sm text-red-500">{moveError}</p>}
          <DialogFooter>
            <button type="button" onClick={() => setMoveTarget(null)} disabled={moving} className="rounded-lg border border-[#d0d5dd] px-4 py-2 text-sm">Cancel</button>
            <button type="button" onClick={moveFile} disabled={moving} className="rounded-lg bg-[#246bfe] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{moving ? "Moving..." : "Move file"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
