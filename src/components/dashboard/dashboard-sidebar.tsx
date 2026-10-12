"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Archive,
  File,
  Image,
  LayoutGrid,
  PlaySquare,
  Share2,
  X,
  HardDrive,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navigation = [
  { label: "All Files", icon: LayoutGrid, category: "all" },
  { label: "Media", icon: PlaySquare, category: "media" },
  { label: "Docs", icon: File, category: "docs" },
  { label: "Images", icon: Image, category: "images" },
  { label: "Others", icon: Archive, category: "others" },
  { label: "Shared with me", icon: Share2, category: null },
] as const;

type FileCategory = "all" | "media" | "docs" | "images" | "others";

type StorageInfo = {
  used: string;
  limit: string;
  remaining: string;
};

type DashboardSidebarProps = {
  open: boolean;
  onClose: () => void;
  activeCategory: FileCategory;
  onCategoryChange: (category: FileCategory) => void;
};

function formatBytes(bytes: bigint): string {
  if (bytes === BigInt(0)) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = Number(bytes);
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  const formatted =
    value >= 100 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1);

  return `${formatted} ${units[unitIndex]}`;
}

export function DashboardSidebar({
  open,
  onClose,
  activeCategory,
  onCategoryChange,
}: DashboardSidebarProps) {
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [storageLoading, setStorageLoading] = useState(true);
  const [storageError, setStorageError] = useState(false);

  const fetchStorage = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/storage", {
        cache: "no-store",
        signal,
      });

      if (!response.ok) {
        throw new Error("Unable to fetch storage");
      }

      const data = await response.json();

      setStorage(data.storage);
      setStorageError(false);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      console.error("Failed to fetch storage:", error);
      setStorageError(true);
    } finally {
      if (!signal?.aborted) {
        setStorageLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadStorage() {
      await fetchStorage(controller.signal);
    }

    void loadStorage();

    const handleStorageUpdate = () => {
      void fetchStorage();
    };

    window.addEventListener("cloudbox:storage-updated", handleStorageUpdate);

    return () => {
      controller.abort();

      window.removeEventListener(
        "cloudbox:storage-updated",
        handleStorageUpdate,
      );
    };
  }, [fetchStorage]);

  const used = storage ? BigInt(storage.used) : BigInt(0);
  const limit = storage ? BigInt(storage.limit) : BigInt(0);
  const remaining = storage ? BigInt(storage.remaining) : BigInt(0);

  const percentage =
    limit > BigInt(0) ? Math.min(100, Number((used * BigInt(100)) / limit)) : 0;

  const isAlmostFull = percentage >= 90;

  return (
    <>
      {open && (
        <button
          className="fixed inset-0 z-40 bg-background/25 lg:hidden"
          onClick={onClose}
          aria-label="Close navigation"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col border-r bg-background px-4 pb-6 pt-[92px] transition-transform lg:sticky lg:top-0 lg:z-10 lg:h-[calc(100vh-74px)] lg:translate-x-0 lg:pt-7 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-5 lg:hidden"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <X />
        </Button>

        <nav aria-label="File navigation" className="flex flex-col gap-1">
          {navigation.map(({ label, icon: Icon, category }) => {
            const isActive = category !== null && activeCategory === category;

            return (
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className="w-full justify-start gap-3"
                key={label}
                disabled={category === null}
                onClick={() => {
                  if (category) {
                    onCategoryChange(category);
                    onClose();
                  }
                }}
              >
                <Icon strokeWidth={isActive ? 2.3 : 1.8} />
                {label}
              </Button>
            );
          })}
        </nav>

        <Separator className="my-7" />

        <section
          aria-label="Storage usage"
          className="mt-auto rounded-xl bg-muted/50 p-4"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive size={16} className="text-muted-foreground" />
              <h2 className="text-sm font-semibold">Storage</h2>
            </div>

            <span className="text-xs text-muted-foreground">Overview</span>
          </div>

          {storageLoading ? (
            <div
              className="space-y-3"
              aria-label="Loading storage usage"
              aria-busy="true"
            >
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
              <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            </div>
          ) : storageError || !storage ? (
            <div className="space-y-2">
              <p className="text-xs leading-5 text-muted-foreground">
                Unable to load storage details.
              </p>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setStorageLoading(true);
                  void fetchStorage();
                }}
              >
                Retry
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold">
                  {formatBytes(used)}
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    of {formatBytes(limit)}
                  </span>
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {formatBytes(remaining)} remaining
                </p>
              </div>

              <div
                className="h-2 w-full overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-label="Storage used"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percentage}
              >
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isAlmostFull ? "bg-destructive" : "bg-primary"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-xs ${
                    isAlmostFull
                      ? "font-medium text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {percentage}% used
                </span>

                {isAlmostFull && (
                  <span className="text-xs text-destructive">Almost full</span>
                )}
              </div>
            </div>
          )}
        </section>
      </aside>
    </>
  );
}
