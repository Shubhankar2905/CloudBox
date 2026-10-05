"use client";

import {
  Archive,
  FileImage,
  FileText,
  MoreHorizontal,
  PlaySquare,
  Presentation,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const files = [
  {
    name: "project-design.fig",
    type: "Design",
    size: "12.4 MB",
    modified: "2 min ago",
    icon: FileImage,
    color: "bg-[#f1eaff] text-[#8b5cf6]",
  },
  {
    name: "company-report.pdf",
    type: "PDF",
    size: "4.2 MB",
    modified: "1 hour ago",
    icon: FileText,
    color: "bg-[#fff0ef] text-[#f04438]",
  },
  {
    name: "vacation.jpg",
    type: "Image",
    size: "2.1 MB",
    modified: "Yesterday",
    icon: FileImage,
    color: "bg-[#e9f8f2] text-[#18a66a]",
  },
  {
    name: "presentation.pptx",
    type: "Document",
    size: "8.6 MB",
    modified: "Yesterday",
    icon: Presentation,
    color: "bg-[#fff4df] text-[#e59a12]",
  },
  {
    name: "demo-video.mp4",
    type: "Video",
    size: "120 MB",
    modified: "2 days ago",
    icon: PlaySquare,
    color: "bg-[#e8f1ff] text-[#246bfe]",
  },
  {
    name: "archive-assets.zip",
    type: "Archive",
    size: "86 MB",
    modified: "3 days ago",
    icon: Archive,
    color: "bg-[#f2f4f7] text-[#667085]",
  },
];

export function RecentFiles({ query }: { query: string }) {
  const filteredFiles = files.filter((file) =>
    `${file.name} ${file.type}`.toLowerCase().includes(query),
  );
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
        <div className="grid grid-cols-[minmax(220px,2fr)_1fr_1fr_1fr_0.7fr_40px] border-b border-[#edf0f3] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#98a2b3]">
          <span>File</span>
          <span>Type</span>
          <span>Size</span>
          <span>Modified</span>
          <span>Owner</span>
          <span />
        </div>
        {filteredFiles.length > 0 ? (
          filteredFiles.map(
            ({ name, type, size, modified, icon: Icon, color }) => (
              <div
                key={name}
                className="grid grid-cols-[minmax(220px,2fr)_1fr_1fr_1fr_0.7fr_40px] items-center border-b border-[#f0f2f5] px-5 py-3.5 text-sm last:border-0 hover:bg-[#fbfcfe]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`grid size-8 shrink-0 place-items-center rounded-lg ${color}`}
                  >
                    <Icon className="size-4" strokeWidth={1.8} />
                  </div>
                  <span className="truncate font-medium text-[#344054]">
                    {name}
                  </span>
                </div>
                <span className="text-[#667085]">{type}</span>
                <span className="text-[#667085]">{size}</span>
                <span className="text-[#667085]">{modified}</span>
                <span className="text-[#667085]">Me</span>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        className="rounded-md p-1.5 text-[#98a2b3] hover:bg-[#f2f4f7] hover:text-[#475467]"
                        aria-label={`Actions for ${name}`}
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
            ),
          )
        ) : (
          <p className="px-5 py-8 text-center text-sm text-[#98a2b3]">
            No files match your search.
          </p>
        )}
      </div>
    </section>
  );
}
