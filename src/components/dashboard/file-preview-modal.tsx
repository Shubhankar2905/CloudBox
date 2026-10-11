"use client";

import { useEffect } from "react";
import { Download, Share2, X } from "lucide-react";
import type { FileItem } from "@/components/dashboard/recent-files";
import { Button } from "@/components/ui/button";
import { PreviewBody } from "@/components/dashboard/preview-body";

type FilePreviewModalProps = {
  file: FileItem;
  onClose: () => void;
  onShare: () => void;
  onDownload: () => void;
  canShare: boolean;
  canDownload: boolean;
};

export function FilePreviewModal({
  file,
  onClose,
  onShare,
  onDownload,
  canShare,
  canDownload,
}: FilePreviewModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 text-white">
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-white/10 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close preview" className="text-white hover:bg-white/10 hover:text-white">
            <X />
          </Button>
          <h1 className="truncate text-sm font-medium">{file.name}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {canShare && <Button variant="ghost" onClick={onShare} className="text-white hover:bg-white/10 hover:text-white"><Share2 data-icon="inline-start" /> Share</Button>}
          {canDownload && <Button variant="secondary" onClick={onDownload}><Download data-icon="inline-start" /> Download</Button>}
        </div>
      </header>
      <div className="min-h-0 flex-1 p-4">
        <PreviewBody file={file} onDownload={onDownload} />
      </div>
    </div>
  );
}
