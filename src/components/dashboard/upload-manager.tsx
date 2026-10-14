"use client";

import { useCallback, useRef, useState } from "react";
import { Pause, Play, RotateCcw, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatFileSize } from "./file-utils";

const MULTIPART_THRESHOLD = 100 * 1024 * 1024;
const CONCURRENCY = 4;
const MAX_ATTEMPTS = 3;

type UploadStatus =
  | "uploading"
  | "paused"
  | "retrying"
  | "completing"
  | "completed"
  | "failed"
  | "cancelled";

export type UploadItem = {
  id: string;
  file: File;
  relativePath?: string;
  uploaded: number;
  status: UploadStatus;
  error?: string;
  request?: XMLHttpRequest;
};

type MultipartSession = {
  fileId: string;
  uploadId: string;
  partSize: number;
  totalParts: number;
  completedParts: Map<number, string>;
  partProgress: Map<number, number>;
  requests: Set<XMLHttpRequest>;
  paused: boolean;
  cancelled: boolean;
};

function getUploadId(file: File, relativePath?: string) {
  return `${relativePath || file.name}:${file.size}:${file.lastModified}`;
}

export function useUploadManager(
  currentFolderId: string | null,
  onCompleted: () => void,
) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const sessions = useRef(new Map<string, MultipartSession>());
  const itemsRef = useRef(new Map<string, UploadItem>());

  const sync = useCallback((item: UploadItem) => {
    itemsRef.current.set(item.id, item);
    setItems(Array.from(itemsRef.current.values()));
  }, []);

  const remove = useCallback((id: string) => {
    itemsRef.current.delete(id);
    setItems(Array.from(itemsRef.current.values()));
  }, []);

  const updateUploaded = useCallback(
    (item: UploadItem, uploaded: number) => {
      item.uploaded = uploaded;
      sync(item);
    },
    [sync],
  );

  const uploadSmallFile = useCallback(
    (item: UploadItem) =>
      new Promise<void>((resolve, reject) => {
        const request = new XMLHttpRequest();
        const formData = new FormData();
        formData.append("file", item.file);
        if (currentFolderId) formData.append("folderId", currentFolderId);
        if (item.relativePath) {
          formData.append("relativePath", item.relativePath);
        }
        request.open("POST", "/api/upload");
        request.upload.onprogress = (event) => {
          if (event.lengthComputable) updateUploaded(item, event.loaded);
        };
        request.onload = () => {
          if (request.status >= 200 && request.status < 300) {
            updateUploaded(item, item.file.size);
            resolve();
          } else {
            reject(new Error("Upload failed"));
          }
        };
        request.onerror = () => reject(new Error("Network error"));
        request.onabort = () =>
          reject(new DOMException("Upload paused", "AbortError"));
        item.status = "uploading";
        sync(item);
        request.send(formData);
        item.request = request;
      }),
    [currentFolderId, sync, updateUploaded],
  );

  const uploadPart = useCallback(
    async (item: UploadItem, session: MultipartSession, partNumber: number) => {
      const start = (partNumber - 1) * session.partSize;
      const end = Math.min(start + session.partSize, item.file.size);
      const part = item.file.slice(start, end);
      let lastError: unknown;

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        try {
          const urlResponse = await fetch("/api/uploads/parts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileId: session.fileId,
              uploadId: session.uploadId,
              partNumber,
            }),
          });
          const urlData = await urlResponse.json();
          if (!urlResponse.ok) {
            throw new Error(urlData.error || "Unable to prepare upload part");
          }

          const etag = await new Promise<string>((resolve, reject) => {
            const request = new XMLHttpRequest();
            session.requests.add(request);
            request.open("PUT", urlData.url);
            request.upload.onprogress = (event) => {
              if (!event.lengthComputable) return;
              session.partProgress.set(partNumber, event.loaded);
              const completed = Array.from(session.completedParts.keys()).reduce(
                (total, number) =>
                  total +
                  Math.min(
                    session.partSize,
                    item.file.size - (number - 1) * session.partSize,
                  ),
                0,
              );
              const active = Array.from(session.partProgress.values()).reduce(
                (total, value) => total + value,
                0,
              );
              updateUploaded(item, Math.min(item.file.size, completed + active));
            };
            request.onload = () => {
              session.requests.delete(request);
              if (request.status >= 200 && request.status < 300) {
                resolve(request.getResponseHeader("ETag") || "");
              } else {
                reject(new Error(`Part ${partNumber} failed`));
              }
            };
            request.onerror = () => {
              session.requests.delete(request);
              reject(new Error(`Part ${partNumber} failed`));
            };
            request.onabort = () => {
              session.requests.delete(request);
              reject(new DOMException("Upload paused", "AbortError"));
            };
            request.send(part);
          });
          if (!etag) throw new Error("S3 did not return an ETag");
          session.completedParts.set(partNumber, etag);
          session.partProgress.delete(partNumber);
          updateUploaded(
            item,
            Array.from(session.completedParts.keys()).reduce(
              (total, number) =>
                total +
                Math.min(
                  session.partSize,
                  item.file.size - (number - 1) * session.partSize,
                ),
              0,
            ),
          );
          return;
        } catch (error) {
          lastError = error;
          if (error instanceof DOMException && error.name === "AbortError") {
            throw error;
          }
          if (attempt < MAX_ATTEMPTS - 1) {
            item.status = "retrying";
            sync(item);
            await new Promise((resolve) =>
              setTimeout(resolve, 500 * (attempt + 1)),
            );
          }
        }
      }
      throw lastError instanceof Error
        ? lastError
        : new Error("Multipart part upload failed");
    },
    [sync, updateUploaded],
  );

  const runMultipart = useCallback(
    async (item: UploadItem, session: MultipartSession) => {
      let nextPart = 1;
      try {
        const worker = async () => {
          while (!session.paused && !session.cancelled) {
            while (session.completedParts.has(nextPart)) nextPart += 1;
            if (nextPart > session.totalParts) return;
            const partNumber = nextPart;
            nextPart += 1;
            await uploadPart(item, session, partNumber);
          }
        };
        await Promise.all(
          Array.from(
            { length: Math.min(CONCURRENCY, session.totalParts) },
            worker,
          ),
        );
        if (session.paused || session.cancelled) return;

        item.status = "completing";
        sync(item);
        const parts = Array.from(session.completedParts.entries())
          .sort(([a], [b]) => a - b)
          .map(([PartNumber, ETag]) => ({ PartNumber, ETag }));
        const response = await fetch("/api/uploads/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileId: session.fileId,
            uploadId: session.uploadId,
            parts,
          }),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Unable to complete upload");
        }
        item.uploaded = item.file.size;
        item.status = "completed";
        sync(item);
        sessions.current.delete(item.id);
        onCompleted();
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          if (!session.cancelled) {
            item.status = "paused";
            sync(item);
          }
          return;
        }
        item.status = "failed";
        item.error = error instanceof Error ? error.message : "Upload failed";
        sync(item);
      }
    },
    [onCompleted, sync, uploadPart],
  );

  const start = useCallback(
    async (file: File, relativePath?: string) => {
      const id = getUploadId(file, relativePath);
      const existing = itemsRef.current.get(id);
      const item: UploadItem = existing || {
        id,
        file,
        relativePath,
        uploaded: 0,
        status: "uploading",
      };
      item.status = "uploading";
      item.error = undefined;
      sync(item);

      if (file.size <= MULTIPART_THRESHOLD) {
        try {
          await uploadSmallFile(item);
          item.status = "completed";
          sync(item);
          onCompleted();
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            item.status = "paused";
          } else {
            item.status = "failed";
            item.error = error instanceof Error ? error.message : "Upload failed";
          }
          sync(item);
        }
        return;
      }

      let session = sessions.current.get(id);
      if (!session) {
        const response = await fetch("/api/uploads/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || "application/octet-stream",
            folderId: currentFolderId,
            relativePath,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          item.status = "failed";
          item.error = data.message || data.error || "Unable to start upload";
          sync(item);
          return;
        }
        session = {
          fileId: data.fileId,
          uploadId: data.uploadId,
          partSize: data.partSize,
          totalParts: data.totalParts,
          completedParts: new Map(),
          partProgress: new Map(),
          requests: new Set(),
          paused: false,
          cancelled: false,
        };
        sessions.current.set(id, session);
      }
      session.paused = false;
      session.cancelled = false;
      void runMultipart(item, session);
    },
    [currentFolderId, onCompleted, runMultipart, sync, uploadSmallFile],
  );

  const pause = useCallback(
    (id: string) => {
      const session = sessions.current.get(id);
      if (session) {
        session.paused = true;
        session.requests.forEach((request) => request.abort());
      }
      const item = itemsRef.current.get(id);
      if (item) {
        item.request?.abort();
        item.status = "paused";
        sync(item);
      }
    },
    [sync],
  );

  const cancel = useCallback(
    async (id: string) => {
      const session = sessions.current.get(id);
      if (session) {
        session.cancelled = true;
        session.requests.forEach((request) => request.abort());
        await fetch("/api/uploads/abort", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileId: session.fileId,
            uploadId: session.uploadId,
          }),
        }).catch((error) => console.error("Failed to abort upload:", error));
        sessions.current.delete(id);
      }
      itemsRef.current.get(id)?.request?.abort();
      remove(id);
    },
    [remove],
  );

  const retry = useCallback(
    (id: string) => {
      const item = itemsRef.current.get(id);
      if (item) void start(item.file, item.relativePath);
    },
    [start],
  );

  return { items, start, pause, cancel, retry };
}

export function UploadManager({
  items,
  onPause,
  onResume,
  onRetry,
  onCancel,
}: {
  items: UploadItem[];
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onRetry: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  if (!items.length) return null;
  return (
    <aside className="fixed right-4 bottom-4 z-40 w-[min(400px,calc(100vw-2rem))] space-y-3 rounded-xl border bg-background p-3 shadow-lg">
      <div className="flex items-center gap-2 text-sm font-medium">
        <UploadCloud className="size-4" />
        Uploads
      </div>
      {items.map((item) => {
        const percentage = item.file.size
          ? Math.min(100, (item.uploaded / item.file.size) * 100)
          : 0;
        const active = ["uploading", "retrying", "completing"].includes(item.status);
        return (
          <div key={item.id} className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium">
                {item.relativePath || item.file.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {item.status[0].toUpperCase() + item.status.slice(1)}
              </span>
            </div>
            <Progress value={percentage} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {formatFileSize(String(item.uploaded))} /{" "}
                {formatFileSize(String(item.file.size))}
              </span>
              <span>{Math.round(percentage)}%</span>
            </div>
            {item.error && <p className="text-xs text-destructive">{item.error}</p>}
            <div className="flex justify-end gap-2">
              {active && (
                <Button size="sm" variant="outline" onClick={() => onPause(item.id)}>
                  <Pause data-icon="inline-start" /> Pause
                </Button>
              )}
              {(item.status === "paused" || item.status === "failed") && (
                <Button size="sm" variant="outline" onClick={() => onResume(item.id)}>
                  <Play data-icon="inline-start" /> Resume
                </Button>
              )}
              {item.status === "failed" && (
                <Button size="sm" variant="outline" onClick={() => onRetry(item.id)}>
                  <RotateCcw data-icon="inline-start" /> Retry
                </Button>
              )}
              {item.status !== "completed" && (
                <Button size="sm" variant="ghost" onClick={() => onCancel(item.id)} aria-label={`Cancel ${item.file.name}`}>
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
