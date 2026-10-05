"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { FolderGrid } from "@/components/dashboard/folder-grid";
import { FileOverview } from "@/components/dashboard/file-overview";
import { RecentFiles } from "@/components/dashboard/recent-files";

export function DashboardShell() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#1d2939]">
      <DashboardHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onMenuClick={() => setSidebarOpen(true)}
      />
      <div className="flex">
        <DashboardSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1480px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
            <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8491a5]">
                  Workspace
                </p>
                <h1 className="text-[27px] font-semibold tracking-[-0.03em] text-[#182230]">
                  My Files
                </h1>
                <p className="mt-1 text-sm text-[#8793a6]">
                  Manage your files and folders
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-lg border border-[#dfe4eb] bg-white px-4 py-2.5 text-sm font-medium text-[#344054] shadow-[0_1px_2px_rgba(16,24,40,0.03)] transition hover:border-[#b9c4d3] hover:bg-[#fbfcfd]">
                  + New
                </button>
                <label className="cursor-pointer rounded-lg bg-[#246bfe] px-4 py-2.5 text-sm font-medium text-white shadow-[0_5px_12px_rgba(36,107,254,0.2)] transition hover:bg-[#155eef]">
                  <span>Upload file</span>
                  <input type="file" className="sr-only" />
                </label>
              </div>
            </div>

            <FolderGrid query={normalizedQuery} />
            <FileOverview />
            <RecentFiles query={normalizedQuery} />
          </div>
        </main>
      </div>
    </div>
  );
}
