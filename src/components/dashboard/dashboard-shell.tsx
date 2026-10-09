"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { FolderGrid, type FolderItem } from "@/components/dashboard/folder-grid";
import { RecentFiles, type FileItem } from "@/components/dashboard/recent-files";

type FileCategory = "all" | "media" | "docs" | "images" | "others";
export function DashboardShell() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [username, setUsername] = useState("Loading...");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<FileCategory>("all");
  useEffect(() => {
    async function fetchFiles() {
      try {
        const response = await fetch(
          `/api/file?folderId=${encodeURIComponent(currentFolderId || "")}`,
        );

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
  }, [currentFolderId]);
  // for fetching Initial of the user from the API
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

  useEffect(() => {
    async function fetchFolders() {
      try {
        const response = await fetch("/api/folder?all=true");
        if (!response.ok) {
          console.error("Failed to fetch folders");
          return;
        }
        const data = await response.json();
        console.log("Folders from API:", data.folders);
        setFolders(data.folders);
      } catch (error) {
        console.error("Failed to fetch folders:", error);
      }
    }

    fetchFolders();
  }, []);

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const formData = new FormData();

      formData.append("file", file);
      if (currentFolderId) {
        formData.append("folderId", currentFolderId);
      }

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
          folderId: data.file.folderId,
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
  const filteredFiles = files.filter((file) => {
    if (activeCategory === "all") {
      return true;
    }

    if (activeCategory === "images") {
      return file.mimeType.startsWith("image/");
    }

    if (activeCategory === "media") {
      return (
        file.mimeType.startsWith("video/") || file.mimeType.startsWith("audio/")
      );
    }

    if (activeCategory === "docs") {
      return (
        file.mimeType === "application/pdf" ||
        file.mimeType.includes("word") ||
        file.mimeType.includes("document") ||
        file.mimeType.includes("spreadsheet") ||
        file.mimeType.startsWith("text/")
      );
    }

    if (activeCategory === "others") {
      const isImage = file.mimeType.startsWith("image/");

      const isMedia =
        file.mimeType.startsWith("video/") ||
        file.mimeType.startsWith("audio/");

      const isDocument =
        file.mimeType === "application/pdf" ||
        file.mimeType.includes("word") ||
        file.mimeType.includes("document") ||
        file.mimeType.includes("spreadsheet") ||
        file.mimeType.startsWith("text/");

      return !isImage && !isMedia && !isDocument;
    }

    return true;
  });

  const viewConfig = {
    all: {
      title: "My Files",
      description: "Manage your files and folders",
    },
    images: {
      title: "Images",
      description: "All your images",
    },
    media: {
      title: "Media",
      description: "All your media files",
    },
    docs: {
      title: "Docs",
      description: "All your documents",
    },
    others: {
      title: "Others",
      description: "Other files",
    },
  };

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
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1480px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
            <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8491a5]">
                  Workspace
                </p>
                <h1 className="text-[27px] font-semibold tracking-[-0.03em] text-[#182230]">
                  {viewConfig[activeCategory].title}
                </h1>

                <p className="mt-1 text-sm text-[#8793a6]">
                  {viewConfig[activeCategory].description}
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

            {activeCategory === "all" ? (
              <>
                <FolderGrid
                  query={normalizedQuery}
                  folders={folders}
                  currentFolderId={currentFolderId}
                  onNavigate={setCurrentFolderId}
                  onFolderCreated={(newFolder) => {
                    setFolders((currentFolders) => [
                      newFolder,
                      ...currentFolders,
                    ]);
                  }}
                />

                <RecentFiles
                  query={normalizedQuery}
                  files={filteredFiles}
                  folders={folders}
                  onFileMoved={(fileId, folderId) => {
                    setFiles((currentFiles) =>
                      currentFiles
                        .map((file) =>
                          file.id === fileId ? { ...file, folderId } : file,
                        )
                        .filter((file) => file.folderId === currentFolderId),
                    );
                  }}
                />
              </>
            ) : (
              <RecentFiles
                query={normalizedQuery}
                files={filteredFiles}
                folders={folders}
                onFileMoved={(fileId, folderId) => {
                  setFiles((currentFiles) =>
                    currentFiles
                      .map((file) =>
                        file.id === fileId ? { ...file, folderId } : file,
                      )
                      .filter((file) => file.folderId === currentFolderId),
                  );
                }}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
