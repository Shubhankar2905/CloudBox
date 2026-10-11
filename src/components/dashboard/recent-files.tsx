"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
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
import {
  formatFileSize,
  formatModifiedDate,
  getFileIcon,
  getFileType,
  Folder,
} from "./file-utils";
import type { FolderItem } from "./folder-grid";

export type FileItem = {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  createdAt: string;
  folderId: string | null;
};

type RecentFilesProps = {
  query: string;
  files: FileItem[];
  folders: FolderItem[];
  onFileMoved: (fileId: string, folderId: string | null) => void;
  onShareFile: (file: FileItem) => void;
  onPreviewFile: (file: FileItem) => void;
  onRenameFile: (file: FileItem) => void;
  onDeleteFile: (file: FileItem) => void;
  onNavigate: (folderId: string) => void;
  onRenameFolder: (folder: FolderItem) => void;
  onDeleteFolder: (folder: FolderItem) => void;
};

export function RecentFiles({
  query,
  files,
  folders,
  onFileMoved,
  onShareFile,
  onPreviewFile,
  onRenameFile,
  onDeleteFile,
  onNavigate,
  onRenameFolder,
  onDeleteFolder,
}: RecentFilesProps) {
  const [movingFile, setMovingFile] = useState<FileItem | null>(null);
  const [destinationId, setDestinationId] = useState("");
  const [moving, setMoving] = useState(false);
  const filteredFiles = files.filter((file) =>
    `${file.name} ${file.mimeType}`.toLowerCase().includes(query),
  );

  async function moveFile() {
    if (!movingFile) return;
    try {
      setMoving(true);
      const response = await fetch(`/api/file/${movingFile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: destinationId || null }),
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
      onFileMoved(movingFile.id, destinationId || null);
      setMovingFile(null);
      toast.add({
        id: "dashboard-move",
        type: "success",
        title: "Moved successfully",
        description: `${movingFile.name} was moved successfully.`,
      });
    } catch (error) {
      console.error("Move file error:", error);
      toast.add({
        id: "dashboard-move",
        type: "error",
        title: "Move failed",
        description: "Something went wrong while moving the file.",
      });
    } finally {
      setMoving(false);
    }
  }

  return (
    <section aria-labelledby="recent-heading">
      <div className="mb-4 flex items-center justify-between">
        <h2
          id="recent-heading"
          className="text-[17px] font-semibold text-[#1d2939]"
        >
          Files in this folder
        </h2>
      </div>
      <div className="overflow-hidden rounded-xl border border-[#e4e8ee] bg-white">
        <div className="grid grid-cols-[minmax(220px,2fr)_1fr_1fr_1fr_0.7fr_40px] border-b border-[#edf0f3] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#98a2b3]">
          <span>File</span>
          <span>Type</span>
          <span>Size</span>
          <span>Modified</span>
          <span>Owner</span>
          <span />
        </div>
        {folders.length > 0 || filteredFiles.length > 0 ? (
          <>
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="grid grid-cols-[minmax(220px,2fr)_1fr_1fr_1fr_0.7fr_40px] items-center border-b border-[#f0f2f5] px-5 py-3.5 text-sm hover:bg-[#fbfcfe]"
              >
                <button
                  type="button"
                  onClick={() => onNavigate(folder.id)}
                  className="flex min-w-0 items-center gap-3 text-left"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#edf4ff] text-[#246bfe]">
                    <Folder className="size-4 fill-[#cfe0ff]" />
                  </span>
                  <span className="truncate font-medium text-[#344054]">
                    {folder.name}
                  </span>
                </button>
                <span className="text-[#667085]">Folder</span>
                <span className="text-[#667085]">—</span>
                <span className="text-[#667085]">
                  {folder.updatedAt
                    ? formatModifiedDate(folder.updatedAt)
                    : "—"}
                </span>
                <span className="text-[#667085]">Me</span>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        className="rounded-md p-1.5 text-[#98a2b3] hover:bg-[#f2f4f7]"
                        aria-label={`Actions for ${folder.name}`}
                      />
                    }
                  >
                    <MoreHorizontal className="size-[18px]" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
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
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                onDoubleClick={() => onPreviewFile(file)}
                className="grid grid-cols-[minmax(220px,2fr)_1fr_1fr_1fr_0.7fr_40px] items-center border-b border-[#f0f2f5] px-5 py-3.5 text-sm last:border-0 hover:bg-[#fbfcfe]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#f2f4f7] text-[#667085]">
                    {(() => {
                      const Icon = getFileIcon(file.mimeType);
                      return <Icon className="size-4" strokeWidth={1.8} />;
                    })()}
                  </div>
                  <span className="truncate font-medium text-[#344054]">
                    {file.name}
                  </span>
                </div>
                <span className="text-[#667085]">
                  {getFileType(file.mimeType)}
                </span>
                <span className="text-[#667085]">
                  {formatFileSize(file.size)}
                </span>
                <span className="text-[#667085]">
                  {formatModifiedDate(file.createdAt)}
                </span>
                <span className="text-[#667085]">Me</span>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        className="rounded-md p-1.5 text-[#98a2b3] hover:bg-[#f2f4f7] hover:text-[#475467]"
                        aria-label={`Actions for ${file.name}`}
                      />
                    }
                  >
                    <MoreHorizontal className="size-[18px]" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuItem
                      render={<a href={`/api/file/${file.id}/download`} />}
                    >
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onShareFile(file)}>
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setDestinationId(file.folderId || "");
                        setMovingFile(file);
                      }}
                    >
                      Move to folder
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onRenameFile(file)}>
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => onDeleteFile(file)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-[#98a2b3]">
            No files in this folder.
          </p>
        )}
      </div>

      <Dialog
        open={Boolean(movingFile)}
        onOpenChange={(open) => !open && !moving && setMovingFile(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Move file</DialogTitle>
            <DialogDescription>
              Choose a destination for {movingFile?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <select
              value={destinationId}
              onChange={(event) => setDestinationId(event.target.value)}
              className="w-full rounded-lg border border-[#d0d5dd] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#246bfe]"
            >
              <option value="">My Files</option>
              {folders
                .filter((folder) => folder.id !== movingFile?.folderId)
                .map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
            </select>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setMovingFile(null)}
              disabled={moving}
              className="rounded-lg border border-[#d0d5dd] px-4 py-2 text-sm font-medium text-[#344054] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={moveFile}
              disabled={moving}
              className="rounded-lg bg-[#246bfe] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {moving ? "Moving..." : "Move file"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
