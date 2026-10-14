"use client";

import { MoreHorizontal, Pencil, Trash2, FolderInput } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FileItem } from "@/components/dashboard/recent-files";
import type { FolderItem } from "@/components/dashboard/folder-grid";
import {
  formatFileSize,
  formatModifiedDate,
  getFileIcon,
  getFileType,
  Folder,
} from "./file-utils";

type FileGridProps = {
  files: FileItem[];
  folders: FolderItem[];
  query: string;
  onNavigate: (folderId: string) => void;
  onMoveFile: (file: FileItem) => void;
  onPreviewFile: (file: FileItem) => void;
  onShareFile: (file: FileItem) => void;
  onRenameFile: (file: FileItem) => void;
  onDeleteFile: (file: FileItem) => void;
  onRenameFolder: (folder: FolderItem) => void;
  onDeleteFolder: (folder: FolderItem) => void;
  onDownloadFile: (file: FileItem) => void;
};

export function FileGrid({
  files,
  folders,
  query,
  onNavigate,
  onMoveFile,
  onPreviewFile,
  onShareFile,
  onRenameFile,
  onDeleteFile,
  onRenameFolder,
  onDeleteFolder,
  onDownloadFile,
}: FileGridProps) {
  const visibleFolders = folders.filter((folder) =>
    folder.name.toLowerCase().includes(query),
  );
  const visibleFiles = files.filter((file) =>
    `${file.name} ${file.mimeType}`.toLowerCase().includes(query),
  );

  return (
    <div className="space-y-7">
      {visibleFolders.length > 0 && (
        <section aria-labelledby="grid-folders-heading">
          <h2
            id="grid-folders-heading"
            className="mb-3 text-[17px] font-semibold text-[#1d2939]"
          >
            Folders
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3">
            {visibleFolders.map((folder) => (
              <div
                key={folder.id}
                className="group flex min-h-[78px] items-center gap-3 rounded-xl border border-[#e4e8ee] bg-white p-3 transition hover:border-[#b8cdf7] hover:shadow-[0_4px_12px_rgba(25,65,125,0.08)]"
              >
                <button
                  type="button"
                  onClick={() => onNavigate(folder.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-[#edf4ff] text-[#246bfe]">
                    <Folder className="size-6 fill-[#cfe0ff]" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-[#344054]">
                      {folder.name}
                    </span>
                    <span className="mt-1 block text-xs text-[#98a2b3]">
                      {formatModifiedDate(folder.updatedAt)}
                    </span>
                  </span>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        type="button"
                        className="rounded-md p-1 text-muted-foreground opacity-0 transition hover:bg-accent hover:text-accent-foreground group-hover:opacity-100"
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
                      <Pencil /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => onDeleteFolder(folder)}
                    >
                      <Trash2 /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="grid-files-heading">
        <h2
          id="grid-files-heading"
          className="mb-3 text-[17px] font-semibold text-[#1d2939]"
        >
          Files
        </h2>
        {visibleFiles.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-4">
            {visibleFiles.map((file) => {
              const Icon = getFileIcon(file.mimeType);
              const canPreview = file.mimeType.startsWith("image/");
              return (
                <article
                  key={file.id}
                  onDoubleClick={() => onPreviewFile(file)}
                  className="group overflow-hidden rounded-xl border border-[#e4e8ee] bg-white transition hover:border-[#b8cdf7] hover:shadow-[0_6px_18px_rgba(25,65,125,0.08)]"
                >
                  <div className="relative flex h-36 items-center justify-center overflow-hidden bg-[#f7f9fc]">
                    {canPreview ? (
                      <div
                        role="img"
                        aria-label={`Preview of ${file.name}`}
                        className="size-full bg-cover bg-center bg-no-repeat"
                        style={{
                          backgroundImage: `url(/api/file/${file.id}/preview)`,
                        }}
                      />
                    ) : (
                      <Icon
                        className="size-12 text-[#8da8d8]"
                        strokeWidth={1.4}
                      />
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <button
                            type="button"
                            className="absolute right-2 top-2 rounded-md bg-background/90 p-1.5 text-muted-foreground opacity-0 shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground group-hover:opacity-100 focus-visible:opacity-100"
                            aria-label={`Actions for ${file.name}`}
                          />
                        }
                      >
                        <MoreHorizontal className="size-[18px]" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onDownloadFile(file)}>
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onShareFile(file)}>
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onMoveFile(file)}>
                          Move to folder
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onRenameFile(file)}>
                          <Pencil /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => onDeleteFile(file)}
                        >
                          <Trash2 /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="p-3">
                    <p
                      className="truncate text-sm font-medium text-[#344054]"
                      title={file.name}
                    >
                      {file.name}
                    </p>
                    <p className="mt-1 text-xs text-[#98a2b3]">
                      {getFileType(file.mimeType)} · {formatFileSize(file.size)}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-[#d7dee8] bg-white px-4 py-10 text-center text-sm text-[#98a2b3]">
            No files match your search.
          </p>
        )}
      </section>
    </div>
  );
}
