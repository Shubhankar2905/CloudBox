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
import { ShareDialog } from "@/components/dashboard/share-dialog";
import { FilePreviewModal } from "@/components/dashboard/file-preview-modal";
import { ViewToggle, type DashboardView } from "@/components/dashboard/view-toggle";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderOpen } from "lucide-react";
import { toast } from "@/components/ui/toast";

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
  const [renaming, setRenaming] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RenameTarget | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [moveTarget, setMoveTarget] = useState<FileItem | null>(null);
  const [moveDestination, setMoveDestination] = useState("");
  const [moving, setMoving] = useState(false);
  const [filesLoading, setFilesLoading] = useState(true);
  const [foldersLoading, setFoldersLoading] = useState(true);
  const [shareTarget, setShareTarget] = useState<FileItem | null>(null);
  const [previewTarget, setPreviewTarget] = useState<FileItem | null>(null);

  useEffect(() => {
    async function fetchFiles() {
      setFilesLoading(true);
      try {
        const response = await fetch(
          `/api/file?folderId=${encodeURIComponent(currentFolderId || "")}`,
        );
        if (!response.ok) {
          toast.add({
            id: "dashboard-load-files",
            type: "error",
            title: "Unable to load files",
            description: "Please try again.",
          });
          return;
        }
        const data = await response.json();
        setFiles(data.files);
      } catch (error) {
        console.error("Failed to fetch files:", error);
        toast.add({
          id: "dashboard-load-files",
          type: "error",
          title: "Unable to load files",
          description: "Please try again.",
        });
      } finally {
        setFilesLoading(false);
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
      setFoldersLoading(true);
      try {
        const response = await fetch("/api/folder?all=true");
        if (!response.ok) {
          toast.add({
            id: "dashboard-load-folders",
            type: "error",
            title: "Unable to load folders",
            description: "Please try again.",
          });
          return;
        }
        const data = await response.json();
        setFolders(data.folders);
      } catch (error) {
        console.error("Failed to fetch folders:", error);
        toast.add({
          id: "dashboard-load-folders",
          type: "error",
          title: "Unable to load folders",
          description: "Please try again.",
        });
      } finally {
        setFoldersLoading(false);
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
        toast.add({
          id: "dashboard-upload",
          type: "error",
          title: "Upload failed",
          description: data.message || data.error || "Please try again.",
        });
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
      toast.add({
        id: "dashboard-upload",
        type: "success",
        title: "File uploaded",
        description: `${file.name} was uploaded successfully.`,
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast.add({
        id: "dashboard-upload",
        type: "error",
        title: "Upload failed",
        description: "Something went wrong while uploading the file.",
      });
    } finally {
      event.target.value = "";
    }
  }

  function openRename(type: "file" | "folder", item: FileItem | FolderItem) {
    setRenameTarget(type === "file" ? { type, item: item as FileItem } : { type, item: item as FolderItem });
    setRenameValue(item.name);
  }

  async function renameItem() {
    if (!renameTarget || !renameValue.trim()) {
      toast.add({
        id: "dashboard-rename",
        type: "error",
        title: "Rename failed",
        description: "A name is required.",
      });
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
        toast.add({
          id: "dashboard-rename",
          type: "error",
          title: "Rename failed",
          description: data.message || "Please try again.",
        });
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
      toast.add({
        id: "dashboard-rename",
        type: "success",
        title: "Renamed successfully",
        description: `${renameValue.trim()} was renamed successfully.`,
      });
    } catch (error) {
      console.error("Rename error:", error);
      toast.add({
        id: "dashboard-rename",
        type: "error",
        title: "Rename failed",
        description: "Something went wrong while renaming.",
      });
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
        toast.add({
          id: "dashboard-delete",
          type: "error",
          title: "Delete failed",
          description: data.message || "Please try again.",
        });
        return;
      }
      if (deleteTarget.type === "file") {
        setFiles((items) => items.filter((item) => item.id !== deleteTarget.item.id));
      } else {
        setFolders((items) => items.filter((item) => item.id !== deleteTarget.item.id));
      }
      setDeleteTarget(null);
      toast.add({
        id: "dashboard-delete",
        type: "success",
        title: "Deleted successfully",
        description: `${deleteTarget.item.name} was deleted successfully.`,
      });
    } catch (error) {
      console.error("Delete error:", error);
      toast.add({
        id: "dashboard-delete",
        type: "error",
        title: "Delete failed",
        description: "Something went wrong while deleting.",
      });
    } finally {
      setDeleting(false);
    }
  }

  async function moveFile() {
    if (!moveTarget) return;
    try {
      setMoving(true);
      const response = await fetch(`/api/file/${moveTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: moveDestination || null }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.add({
          id: "dashboard-move",
          type: "error",
          title: "Move failed",
          description: data.message || "Please try again.",
        });
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
      toast.add({
        id: "dashboard-move",
        type: "success",
        title: "Moved successfully",
        description: `${moveTarget.name} was moved successfully.`,
      });
    } catch (error) {
      console.error("Move error:", error);
      toast.add({
        id: "dashboard-move",
        type: "error",
        title: "Move failed",
        description: "Something went wrong while moving.",
      });
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
    onShareFile: (file: FileItem) => setShareTarget(file),
    onPreviewFile: (file: FileItem) => setPreviewTarget(file),
    onDeleteFile: (file: FileItem) => {
      setDeleteTarget({ type: "file", item: file });
    },
    onRenameFolder: (folder: FolderItem) => openRename("folder", folder),
    onDeleteFolder: (folder: FolderItem) => {
      setDeleteTarget({ type: "folder", item: folder });
    },
  };

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      <DashboardHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} onMenuClick={() => setSidebarOpen(true)} username={username} />
      <div className="flex">
        <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1480px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
            <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Workspace</p>
                <h1 className="text-[27px] font-semibold tracking-[-0.03em]">{viewConfig[activeCategory].title}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{viewConfig[activeCategory].description}</p>
              </div>
              <div className="flex items-center gap-2">
                <ViewToggle value={view} onChange={setView} />
                <Button nativeButton={false} render={<label className="cursor-pointer" />}>
                  <span>Upload file</span>
                  <input type="file" className="sr-only" onChange={handleFileUpload} />
                </Button>
              </div>
            </div>

            {(filesLoading || foldersLoading) ? (
              <div className="flex flex-col gap-6" aria-label="Loading workspace" aria-busy="true">
                <div className="grid grid-cols-[repeat(auto-fill,minmax(205px,1fr))] gap-3">
                  {Array.from({ length: 4 }, (_, index) => (
                    <Skeleton key={index} className="h-[66px] rounded-lg" />
                  ))}
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-4">
                  {Array.from({ length: 6 }, (_, index) => (
                    <Skeleton key={index} className="h-56 rounded-xl" />
                  ))}
                </div>
              </div>
            ) : (
              <>
            {activeCategory === "all" && (
              <FolderGrid
                query={normalizedQuery}
                folders={folders}
                currentFolderId={currentFolderId}
                onNavigate={setCurrentFolderId}
                onFolderCreated={(folder) => setFolders((items) => [folder, ...items])}
                onRenameFolder={(folder) => openRename("folder", folder)}
                onDeleteFolder={(folder) => {
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
              </>
            )}

            {!filesLoading && !foldersLoading && folders.length === 0 && files.length === 0 && !searchQuery && activeCategory === "all" && (
              <Empty className="mt-6 min-h-64 border">
                <EmptyHeader>
                  <EmptyMedia variant="icon"><FolderOpen /></EmptyMedia>
                  <EmptyTitle>Your workspace is empty</EmptyTitle>
                  <EmptyDescription>Upload a file or create a folder to get started.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </div>
        </main>
      </div>
      {shareTarget && (
        <ShareDialog
          fileId={shareTarget.id}
          fileName={shareTarget.name}
          open={Boolean(shareTarget)}
          onOpenChange={(open) => !open && setShareTarget(null)}
        />
      )}
      {previewTarget && (
        <FilePreviewModal
          file={previewTarget}
          onClose={() => setPreviewTarget(null)}
          onShare={() => setShareTarget(previewTarget)}
          onDownload={() => window.location.assign(`/api/file/${previewTarget.id}/download`)}
          canShare
          canDownload
        />
      )}

      <Dialog open={Boolean(renameTarget)} onOpenChange={(open) => !open && !renaming && setRenameTarget(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Rename {renameTarget?.type}</DialogTitle><DialogDescription>Enter a new name for this {renameTarget?.type}.</DialogDescription></DialogHeader>
          <Input value={renameValue} onChange={(event) => setRenameValue(event.target.value)} maxLength={255} aria-label="New name" />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRenameTarget(null)} disabled={renaming}>Cancel</Button>
            <Button type="button" onClick={renameItem} disabled={renaming || !renameValue.trim()}>{renaming ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Delete {deleteTarget?.type}?</DialogTitle><DialogDescription>This action cannot be undone. {deleteTarget?.type === "folder" && "Folders must be empty before they can be deleted."}</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={deleteItem} disabled={deleting}>{deleting ? "Deleting..." : "Delete"}</Button>
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setMoveTarget(null)} disabled={moving}>Cancel</Button>
            <Button type="button" onClick={moveFile} disabled={moving}>{moving ? "Moving..." : "Move file"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
