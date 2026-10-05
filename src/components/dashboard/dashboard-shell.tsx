"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { FolderGrid } from "@/components/dashboard/folder-grid";
import { RecentFiles } from "@/components/dashboard/recent-files";

type FileItem = {
  id: string;
  name: string;
  size: string;
  mimeType: string;
  createdAt: string;
};

export function DashboardShell() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [username, setUsername] = useState("Loading...");
  const [files, setFiles] = useState<FileItem[]>([]);

  useEffect(() => {
    async function fetchFiles() {
      try {
        const response = await fetch("/api/file");

        if (!response.ok) {
          console.error("Failed to fetch files");
          return;
        }

        const data = await response.json();

        console.log("Files from API:", data.files);

        setFiles(data.files);
      } catch (error) {
        console.error("Failed to fetch files:", error);
      }
    }

    fetchFiles();
  }, []);

  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const response = await fetch("/api/me");

        if (!response.ok) {
          console.error("Failed to fetch user:", response.status);
          return;
        }

        const data = await response.json();

        console.log("Current user:", data);

        if (data.user?.name) {
          setUsername(data.user.name);
        }
      } catch (error) {
        console.error("Failed to fetch current user:", error);
      }
    }

    fetchCurrentUser();
  }, []);
  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Upload failed:", data.error);
        return;
      }

      console.log("Upload successful:", data.file);

      // Add uploaded file to the dashboard immediately
      setFiles((currentFiles) => [
        {
          id: data.file.id,
          name: data.file.name,
          size: data.file.size,
          mimeType: data.file.mimeType,
          createdAt: data.file.createdAt,
        },
        ...currentFiles,
      ]);
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      // Allows selecting the same file again
      event.target.value = "";
    }
  }
  const normalizedQuery = searchQuery.trim().toLowerCase();
  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#1d2939]">
      <DashboardHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onMenuClick={() => setSidebarOpen(true)}
        username={username}
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
                <label className="cursor-pointer rounded-lg bg-[#246bfe] px-4 py-2.5 text-sm font-medium text-white shadow-[0_5px_12px_rgba(36,107,254,0.2)] transition hover:bg-[#155eef]">
                  <span>Upload file</span>
                  <input
                    type="file"
                    className="sr-only"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            </div>

            <FolderGrid query={normalizedQuery} />
            <RecentFiles query={normalizedQuery} files={files} />
          </div>
        </main>
      </div>
    </div>
  );
}
