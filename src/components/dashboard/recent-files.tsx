"use client";

import { useState } from "react";
import { FileText, MoreHorizontal } from "lucide-react";
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
  folders: { id: string; name: string }[];
  onFileMoved: (fileId: string, folderId: string | null) => void;
};

export function RecentFiles({
  query,
  files,
  folders,
  onFileMoved,
}: RecentFilesProps) {
  const [movingFile, setMovingFile] = useState<FileItem | null>(null);
  const [destinationId, setDestinationId] = useState("");
  const [moving, setMoving] = useState(false);
  const [moveError, setMoveError] = useState("");
  const filteredFiles = files.filter((file) =>
    `${file.name} ${file.mimeType}`.toLowerCase().includes(query),
  );

  function getFileType(mimeType: string) {
    if (mimeType === "application/pdf") return "PDF";
    if (mimeType.startsWith("image/")) return "Image";
    if (mimeType.startsWith("video/")) return "Video";
    if (mimeType.startsWith("audio/")) return "Audio";
    if (mimeType.includes("zip") || mimeType.includes("compressed")) return "Archive";
    if (mimeType.includes("word") || mimeType.includes("document")) return "Document";
    return "File";
  }

  async function moveFile() {
    if (!movingFile) return;
    try {
      setMoving(true);
      setMoveError("");
      const response = await fetch(`/api/file/${movingFile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: destinationId || null }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMoveError(data.message || "Failed to move file");
        return;
      }
      onFileMoved(movingFile.id, destinationId || null);
      setMovingFile(null);
    } catch (error) {
      console.error("Move file error:", error);
      setMoveError("Something went wrong while moving the file.");
    } finally {
      setMoving(false);
    }
  }

  return (
    <section aria-labelledby="recent-heading">
      <div className="mb-4 flex items-center justify-between">
        <h2 id="recent-heading" className="text-[17px] font-semibold text-[#1d2939]">
          Files in this folder
        </h2>
      </div>
      <div className="overflow-hidden rounded-xl border border-[#e4e8ee] bg-white">
        <div className="grid grid-cols-[minmax(220px,2fr)_1fr_1fr_1fr_0.7fr_40px] border-b border-[#edf0f3] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#98a2b3]">
          <span>File</span><span>Type</span><span>Size</span><span>Modified</span><span>Owner</span><span />
        </div>
        {filteredFiles.length > 0 ? filteredFiles.map((file) => (
          <div key={file.id} className="grid grid-cols-[minmax(220px,2fr)_1fr_1fr_1fr_0.7fr_40px] items-center border-b border-[#f0f2f5] px-5 py-3.5 text-sm last:border-0 hover:bg-[#fbfcfe]">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#f2f4f7] text-[#667085]"><FileText className="size-4" strokeWidth={1.8} /></div>
              <span className="truncate font-medium text-[#344054]">{file.name}</span>
            </div>
            <span className="text-[#667085]">{getFileType(file.mimeType)}</span>
            <span className="text-[#667085]">{file.size}</span>
            <span className="text-[#667085]">{new Date(file.createdAt).toLocaleDateString()}</span>
            <span className="text-[#667085]">Me</span>
            <DropdownMenu>
              <DropdownMenuTrigger render={<button className="rounded-md p-1.5 text-[#98a2b3] hover:bg-[#f2f4f7] hover:text-[#475467]" aria-label={`Actions for ${file.name}`} />}>
                <MoreHorizontal className="size-[18px]" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem
                  render={<a href={`/api/file/${file.id}/download`} />}
                >
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setDestinationId(file.folderId || ""); setMoveError(""); setMovingFile(file); }}>Move to folder</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )) : <p className="px-5 py-8 text-center text-sm text-[#98a2b3]">No files in this folder.</p>}
      </div>

      <Dialog open={Boolean(movingFile)} onOpenChange={(open) => !open && !moving && setMovingFile(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Move file</DialogTitle><DialogDescription>Choose a destination for {movingFile?.name}.</DialogDescription></DialogHeader>
          <div className="py-4">
            <select value={destinationId} onChange={(event) => setDestinationId(event.target.value)} className="w-full rounded-lg border border-[#d0d5dd] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#246bfe]">
              <option value="">My Files (root)</option>
              {folders.filter((folder) => folder.id !== movingFile?.folderId).map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
            </select>
            {moveError && <p className="mt-2 text-sm text-red-500">{moveError}</p>}
          </div>
          <DialogFooter>
            <button type="button" onClick={() => setMovingFile(null)} disabled={moving} className="rounded-lg border border-[#d0d5dd] px-4 py-2 text-sm font-medium text-[#344054] disabled:opacity-50">Cancel</button>
            <button type="button" onClick={moveFile} disabled={moving} className="rounded-lg bg-[#246bfe] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{moving ? "Moving..." : "Move file"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
