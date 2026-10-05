"use client";

import { FileText, MoreHorizontal } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type FileItem = {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  createdAt: string;
};

type RecentFilesProps = {
  query: string;
  files: FileItem[];
};

export function RecentFiles({ query, files }: RecentFilesProps) {
  const filteredFiles = files.filter((file) =>
    `${file.name} ${file.mimeType}`.toLowerCase().includes(query),
  );

  function getFileType(mimeType: string) {
    if (mimeType === "application/pdf") {
      return "PDF";
    }

    if (mimeType.startsWith("image/")) {
      return "Image";
    }

    if (mimeType.startsWith("video/")) {
      return "Video";
    }

    if (mimeType.startsWith("audio/")) {
      return "Audio";
    }

    if (mimeType.includes("zip") || mimeType.includes("compressed")) {
      return "Archive";
    }

    if (mimeType.includes("word") || mimeType.includes("document")) {
      return "Document";
    }

    return "File";
  }
  return (
    <section aria-labelledby="recent-heading">
      <div className="mb-4 flex items-center justify-between">
        <h2
          id="recent-heading"
          className="text-[17px] font-semibold text-[#1d2939]"
        >
          Recent Uploads
        </h2>

        <button className="text-sm font-medium text-[#246bfe] hover:text-[#155eef]">
          View all <span aria-hidden="true">→</span>
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e4e8ee] bg-white">
        {/* Table Header */}
        <div className="grid grid-cols-[minmax(220px,2fr)_1fr_1fr_1fr_0.7fr_40px] border-b border-[#edf0f3] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#98a2b3]">
          <span>File</span>
          <span>Type</span>
          <span>Size</span>
          <span>Modified</span>
          <span>Owner</span>
          <span />
        </div>

        {/* Files */}
        {filteredFiles.length > 0 ? (
          filteredFiles.map((file) => (
            <div
              key={file.id}
              className="grid grid-cols-[minmax(220px,2fr)_1fr_1fr_1fr_0.7fr_40px] items-center border-b border-[#f0f2f5] px-5 py-3.5 text-sm last:border-0 hover:bg-[#fbfcfe]"
            >
              {/* File name */}
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#f2f4f7] text-[#667085]">
                  <FileText className="size-4" strokeWidth={1.8} />
                </div>

                <span className="truncate font-medium text-[#344054]">
                  {file.name}
                </span>
              </div>

              {/* Type */}
              <span className="text-[#667085]">
                {getFileType(file.mimeType)}
              </span>

              {/* Size */}
              <span className="text-[#667085]">{file.size}</span>

              {/* Modified */}
              <span className="text-[#667085]">
                {new Date(file.createdAt).toLocaleDateString()}
              </span>

              {/* Owner */}
              <span className="text-[#667085]">Me</span>

              {/* Actions */}
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

                <DropdownMenuContent align="end" className="w-28">
                  <DropdownMenuItem>Download</DropdownMenuItem>

                  <DropdownMenuItem>Share</DropdownMenuItem>

                  <DropdownMenuItem variant="destructive">
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        ) : (
          <p className="px-5 py-8 text-center text-sm text-[#98a2b3]">
            No files match your search.
          </p>
        )}
      </div>
    </section>
  );
}
