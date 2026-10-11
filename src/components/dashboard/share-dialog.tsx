"use client";

import { useState } from "react";
import { Check, Clipboard, Link2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";

type ShareDialogProps = {
  fileId: string;
  fileName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ShareResponse = {
  share?: {
    token: string;
    allowDownload: boolean;
    expiresAt: string | null;
  };
  message?: string;
};

function toIsoDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function ShareDialog({
  fileId,
  fileName,
  open,
  onOpenChange,
}: ShareDialogProps) {
  const [allowDownload, setAllowDownload] = useState(true);
  const [expiresAt, setExpiresAt] = useState("");
  const [link, setLink] = useState("");
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [minimumExpiry] = useState(() =>
    new Date(Date.now() + 60_000).toISOString().slice(0, 16),
  );

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setAllowDownload(true);
      setExpiresAt("");
      setLink("");
      setCopied(false);
    }
    onOpenChange(nextOpen);
  }

  async function createLink() {
    const isoExpiry = expiresAt ? toIsoDate(expiresAt) : null;
    if (expiresAt && (!isoExpiry || new Date(isoExpiry) <= new Date())) {
      toast.add({
        id: "dashboard-share",
        type: "error",
        title: "Share link creation failed",
        description: "Choose a future expiry date.",
      });
      return;
    }

    try {
      setCreating(true);
      setCopied(false);
      const response = await fetch(`/api/files/${fileId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowDownload, expiresAt: isoExpiry }),
      });
      const data: ShareResponse = await response.json().catch(() => ({}));
      if (!response.ok || !data.share?.token) {
        toast.add({
          id: "dashboard-share",
          type: "error",
          title: "Share link creation failed",
          description: data.message || "Unable to create share link.",
        });
        return;
      }

      setLink(`${window.location.origin}/share/${data.share.token}`);
      toast.add({
        id: "dashboard-share",
        type: "success",
        title: "Share link created",
        description: "The link is ready to copy.",
      });
    } catch (createError) {
      console.error("Create share link error:", createError);
      toast.add({
        id: "dashboard-share",
        type: "error",
        title: "Share link creation failed",
        description: "Something went wrong while creating the share link.",
      });
    } finally {
      setCreating(false);
    }
  }

  async function copyLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.add({
        id: "dashboard-copy-share",
        type: "success",
        title: "Link copied",
        description: "The share link is on your clipboard.",
      });
    } catch (copyException) {
      console.error("Copy share link error:", copyException);
      setCopied(false);
      toast.add({
        id: "dashboard-copy-share",
        type: "error",
        title: "Copy failed",
        description: "Copy the share link manually instead.",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="z-[60] sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Share {fileName}</DialogTitle>
          <DialogDescription>
            Create a private link that you can send to someone else.
          </DialogDescription>
        </DialogHeader>

        {link ? (
          <div className="space-y-3 py-2">
            <Label htmlFor="share-link">Share link</Label>
            <div className="flex gap-2">
              <Input id="share-link" value={link} readOnly className="h-9" />
              <Button type="button" variant="outline" onClick={copyLink}>
                {copied ? <Check data-icon="inline-start" /> : <Clipboard data-icon="inline-start" />}
                {copied ? "Copied" : "Copy link"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {allowDownload ? "Downloads are enabled." : "Downloads are disabled."}
              {expiresAt ? " This link expires at the selected time." : ""}
            </p>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={allowDownload}
                onChange={(event) => setAllowDownload(event.target.checked)}
                className="size-4 accent-primary"
              />
              Allow downloads
            </label>
            <div className="space-y-2">
              <Label htmlFor="share-expiry">Link expiry (optional)</Label>
              <Input
                id="share-expiry"
                type="datetime-local"
                value={expiresAt}
                min={minimumExpiry}
                onChange={(event) => setExpiresAt(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank for a link without an expiry.
              </p>
            </div>
          </div>
        )}

        {!link && (
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
              Cancel
            </Button>
            <Button type="button" onClick={createLink} disabled={creating}>
              {creating ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Link2 data-icon="inline-start" />}
              {creating ? "Creating..." : "Create link"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
