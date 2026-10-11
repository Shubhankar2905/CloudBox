"use client";

import { useEffect, useState } from "react";
import { Download, FileIcon, Loader2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFileSize, getFileType } from "@/components/dashboard/file-utils";

type PublicSharePageProps = {
  token: string;
};

type ShareMetadata = {
  file: {
    name: string;
    size: string;
    mimeType: string;
  };
  allowDownload: boolean;
  expiresAt: string | null;
};

export function PublicSharePage({ token }: PublicSharePageProps) {
  const [share, setShare] = useState<ShareMetadata | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function loadShare() {
      try {
        const response = await fetch(
          `/api/share/${encodeURIComponent(token)}`,
          {
            cache: "no-store",
          },
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.share) {
          setError(data.message || "This share link is unavailable.");
          return;
        }
        setShare(data.share);
      } catch (loadError) {
        console.error("Load public share error:", loadError);
        setError("We couldn't load this share link.");
      } finally {
        setLoading(false);
      }
    }
    loadShare();
  }, [token]);

  async function downloadFile() {
    try {
      setDownloading(true);
      setError("");
      const metadataResponse = await fetch(
        `/api/share/${encodeURIComponent(token)}`,
        { cache: "no-store" },
      );
      const metadata = await metadataResponse.json().catch(() => ({}));
      if (!metadataResponse.ok || !metadata.share) {
        setError(metadata.message || "This share link is no longer available.");
        return;
      }

      // Navigate instead of fetching the redirect so the browser handles the
      // private S3 response without requiring S3 CORS access for this page.
      window.location.assign(
        `/api/share/${encodeURIComponent(token)}/download`,
      );
    } catch (downloadError) {
      console.error("Download shared file error:", downloadError);
      setError("We couldn't prepare the download. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <section className="w-full max-w-lg rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
            <Loader2 className="size-8 animate-spin" />
            <p className="text-sm">Loading shared file...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <Share2 className="mx-auto mb-4 size-10 text-muted-foreground" />
            <h1 className="text-xl font-semibold">Share link unavailable</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          </div>
        ) : share ? (
          <div className="text-center">
            <div className="mx-auto mb-5 grid size-14 place-items-center rounded-xl bg-primary/10 text-primary">
              <FileIcon className="size-7" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Shared file
            </p>
            <h1 className="mt-2 wrap-break-word text-2xl font-semibold">
              {share.file.name}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {getFileType(share.file.mimeType)} ·{" "}
              {formatFileSize(share.file.size)}
            </p>
            {share.expiresAt && (
              <p className="mt-3 text-xs text-muted-foreground">
                Link expires {new Date(share.expiresAt).toLocaleString()}
              </p>
            )}
            {share.allowDownload ? (
              <Button
                className="mt-7 w-full"
                onClick={downloadFile}
                disabled={downloading}
              >
                {downloading ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <Download data-icon="inline-start" />
                )}
                {downloading ? "Preparing download..." : "Download file"}
              </Button>
            ) : (
              <p className="mt-7 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
                Downloads are disabled for this share link.
              </p>
            )}
            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          </div>
        ) : null}
      </section>
    </main>
  );
}
