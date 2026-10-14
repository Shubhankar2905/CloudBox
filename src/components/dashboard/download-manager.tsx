"use client";

import { useCallback, useRef, useState } from "react";
import { Download, Pause, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { FileItem } from "@/components/dashboard/recent-files";
import { formatFileSize } from "./file-utils";

type DownloadStatus = "downloading" | "paused" | "completed" | "cancelled" | "error";
type DownloadEntry = {
  file: FileItem;
  downloaded: number;
  status: DownloadStatus;
  chunks: Blob[];
};

export function useDownloadManager() {
  const [downloads, setDownloads] = useState<DownloadEntry[]>([]);
  const controllers = useRef(new Map<string, AbortController>());
  const cancelled = useRef(new Set<string>());
  const entries = useRef(new Map<string, DownloadEntry>());

  const sync = useCallback((entry: DownloadEntry) => {
    entries.current.set(entry.file.id, entry);
    setDownloads(Array.from(entries.current.values()));
  }, []);

  const startDownload = useCallback(async (file: FileItem) => {
    const existing = entries.current.get(file.id);
    const entry: DownloadEntry = existing || {
      file,
      downloaded: 0,
      status: "downloading",
      chunks: [],
    };
    cancelled.current.delete(file.id);
    entry.status = "downloading";
    sync(entry);

    const controller = new AbortController();
    controllers.current.set(file.id, controller);
    try {
      const start = entry.downloaded;
      const response = await fetch(`/api/file/${encodeURIComponent(file.id)}/download`, {
        headers: start > 0 ? { Range: `bytes=${start}-` } : undefined,
        signal: controller.signal,
      });
      if (!response.ok && response.status !== 206) {
        throw new Error(`Download failed (${response.status})`);
      }
      if (start > 0 && response.status !== 206) {
        entry.downloaded = 0;
        entry.chunks = [];
        throw new Error("Server did not honor the resume range");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Download stream is unavailable");
      const contentLength = Number(response.headers.get("Content-Length") || 0);
      const expected = start + contentLength;
      while (true) {
        const result = await reader.read();
        if (result.done) break;
        if (!result.value) continue;
        entry.chunks.push(new Blob([result.value]));
        entry.downloaded += result.value.byteLength;
        sync(entry);
      }
      if (expected > 0 && entry.downloaded < expected) {
        throw new Error("Download ended before all bytes were received");
      }
      const blob = new Blob(entry.chunks, { type: file.mimeType });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = file.name;
      anchor.click();
      URL.revokeObjectURL(url);
      entry.status = "completed";
      sync(entry);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        if (cancelled.current.has(file.id)) return;
        entry.status = "paused";
      } else {
        console.error("Download error:", error);
        entry.status = "error";
      }
      sync(entry);
    } finally {
      controllers.current.delete(file.id);
    }
  }, [sync]);

  const pauseDownload = useCallback((id: string) => {
    controllers.current.get(id)?.abort();
  }, []);

  const cancelDownload = useCallback((id: string) => {
    cancelled.current.add(id);
    controllers.current.get(id)?.abort();
    entries.current.delete(id);
    setDownloads(Array.from(entries.current.values()));
  }, []);

  return { downloads, startDownload, pauseDownload, cancelDownload };
}

export function DownloadManager({
  downloads,
  onPause,
  onResume,
  onCancel,
}: {
  downloads: DownloadEntry[];
  onPause: (id: string) => void;
  onResume: (file: FileItem) => void;
  onCancel: (id: string) => void;
}) {
  if (!downloads.length) return null;
  return (
    <aside className="fixed right-4 bottom-4 z-40 w-[min(380px,calc(100vw-2rem))] space-y-3 rounded-xl border bg-background p-3 shadow-lg">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Download className="size-4" />
        Downloads
      </div>
      {downloads.map((download) => {
        const total = Number(download.file.size);
        const percentage = total ? Math.min(100, (download.downloaded / total) * 100) : 0;
        return (
          <div key={download.file.id} className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium">{download.file.name}</span>
              <span className="text-xs text-muted-foreground">
                {download.status === "downloading"
                  ? "Downloading"
                  : download.status === "paused"
                    ? "Paused"
                    : download.status === "completed"
                      ? "Completed"
                      : download.status === "error"
                        ? "Failed"
                        : "Cancelled"}
              </span>
            </div>
            <Progress value={percentage} />
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>{formatFileSize(String(download.downloaded))} / {formatFileSize(download.file.size)}</span>
              <span>{Math.round(percentage)}%</span>
            </div>
            <div className="flex justify-end gap-2">
              {download.status === "downloading" && (
                <Button size="sm" variant="outline" onClick={() => onPause(download.file.id)}>
                  <Pause data-icon="inline-start" /> Pause
                </Button>
              )}
              {(download.status === "paused" || download.status === "error") && (
                <Button size="sm" variant="outline" onClick={() => onResume(download.file)}>
                  <Play data-icon="inline-start" /> Resume
                </Button>
              )}
              {download.status !== "completed" && (
                <Button size="sm" variant="ghost" onClick={() => onCancel(download.file.id)} aria-label={`Cancel ${download.file.name}`}>
                  <X />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </aside>
  );
}
