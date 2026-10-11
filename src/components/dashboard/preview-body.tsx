"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FileItem } from "@/components/dashboard/recent-files";
import { Button } from "@/components/ui/button";

type PreviewBodyProps = {
  file: FileItem;
  onDownload: () => void;
};

type PreviewState = "loading" | "ready" | "error" | "unsupported";

function extension(name: string) {
  return name.split(".").pop()?.toLowerCase() || "";
}

function isLargeClientPreview(file: FileItem) {
  const size = Number(file.size);
  return Number.isFinite(size) && size > 10 * 1024 * 1024;
}

function Fallback({ message, onDownload }: { message: string; onDownload: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center text-white">
      <p className="text-sm text-white/70">{message}</p>
      <Button variant="secondary" onClick={onDownload}>Download file</Button>
    </div>
  );
}

function SpreadsheetViewer({ file, onDownload }: PreviewBodyProps) {
  const [state, setState] = useState<PreviewState>(() =>
    isLargeClientPreview(file) ? "unsupported" : "loading",
  );
  const [sheets, setSheets] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState("");
  const [rows, setRows] = useState<unknown[][]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch(`/api/file/${file.id}/preview`);
        if (!response.ok) throw new Error("Unable to fetch spreadsheet");
        const buffer = await response.arrayBuffer();
        const XLSX = await import("xlsx");
        const workbook = XLSX.read(buffer, { type: "array" });
        const names = workbook.SheetNames;
        if (!names.length) throw new Error("Spreadsheet has no sheets");
        const first = names[0];
        const values = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[first], {
          header: 1,
          defval: "",
        }).slice(0, 500);
        if (!cancelled) {
          setSheets(names);
          setActiveSheet(first);
          setRows(values);
          setState("ready");
        }
      } catch (error) {
        console.error("Spreadsheet preview error:", error);
        if (!cancelled) setState("error");
      }
    }
    if (!isLargeClientPreview(file)) load();
    return () => { cancelled = true; };
  }, [file]);

  async function selectSheet(name: string) {
    try {
      const response = await fetch(`/api/file/${file.id}/preview`);
      if (!response.ok) throw new Error("Unable to fetch spreadsheet");
      const buffer = await response.arrayBuffer();
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(buffer, { type: "array" });
      setRows(XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[name], {
        header: 1,
        defval: "",
      }).slice(0, 500));
      setActiveSheet(name);
    } catch (error) {
      console.error("Spreadsheet sheet error:", error);
      setState("error");
    }
  }

  if (state === "loading") return <div className="p-6 text-sm text-white/70">Loading spreadsheet...</div>;
  if (state === "unsupported") return <Fallback message="This spreadsheet is too large for in-browser preview." onDownload={onDownload} />;
  if (state === "error") return <Fallback message="This spreadsheet could not be previewed." onDownload={onDownload} />;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-auto bg-white text-slate-900">
        <table className="min-w-full border-collapse text-left text-sm">
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b">
                <th className="sticky left-0 bg-slate-50 px-3 py-2 text-right font-medium text-slate-500">{rowIndex + 1}</th>
                {row.map((cell, cellIndex) => <td key={cellIndex} className="border-l px-3 py-2 align-top">{String(cell ?? "")}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-1 overflow-x-auto border-t border-white/10 bg-slate-900 p-2">
        {sheets.map((name) => (
          <button key={name} type="button" onClick={() => selectSheet(name)} className={`shrink-0 rounded px-3 py-1 text-xs ${name === activeSheet ? "bg-white text-slate-900" : "text-white/70 hover:bg-white/10"}`}>
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}

function DocxViewer({ file, onDownload }: PreviewBodyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<PreviewState>(() =>
    isLargeClientPreview(file) ? "unsupported" : "loading",
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch(`/api/file/${file.id}/preview`);
        if (!response.ok) throw new Error("Unable to fetch document");
        const buffer = await response.arrayBuffer();
        const { renderAsync } = await import("docx-preview");
        if (cancelled || !containerRef.current) return;
        await renderAsync(buffer, containerRef.current);
        if (!cancelled) setState("ready");
      } catch (error) {
        console.error("DOCX preview error:", error);
        if (!cancelled) setState("error");
      }
    }
    if (!isLargeClientPreview(file)) load();
    return () => { cancelled = true; };
  }, [file]);

  if (state === "loading") return <div className="p-6 text-sm text-white/70">Loading document...</div>;
  if (state === "unsupported") return <Fallback message="This document is too large for in-browser preview." onDownload={onDownload} />;
  if (state === "error") return <Fallback message="This document could not be previewed." onDownload={onDownload} />;
  return <div ref={containerRef} className="h-full overflow-auto bg-white p-4 text-slate-900" />;
}

export function PreviewBody({ file, onDownload }: PreviewBodyProps) {
  const type = file.mimeType.toLowerCase();
  const ext = useMemo(() => extension(file.name), [file.name]);
  const source = `/api/file/${file.id}/preview`;

  if (type.startsWith("image/")) return <img src={source} alt={file.name} className="max-h-full max-w-full object-contain" />;
  if (type.startsWith("video/")) return <video src={source} controls className="max-h-full max-w-full" />;
  if (type.startsWith("audio/")) return <audio src={source} controls />;
  if (type === "application/pdf" || ext === "pdf") return <iframe src={source} title={file.name} className="h-full w-full bg-white" />;
  if (type.includes("wordprocessingml.document") || ext === "docx") return <DocxViewer file={file} onDownload={onDownload} />;
  if (type.includes("spreadsheetml") || type === "text/csv" || ["xlsx", "xls", "csv"].includes(ext)) return <SpreadsheetViewer file={file} onDownload={onDownload} />;
  if (type.includes("presentationml") || ext === "pptx") return <PptxViewer file={file} onDownload={onDownload} />;
  return <Fallback message="No preview is available for this file type." onDownload={onDownload} />;
}

function PptxViewer({ file, onDownload }: PreviewBodyProps) {
  const [state, setState] = useState<PreviewState>("loading");
  const [url, setUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/file/${file.id}/preview?format=json`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to prepare presentation");
        return response.json();
      })
      .then((data: { url?: string }) => {
        if (!cancelled && data.url) {
          setUrl(`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(data.url)}`);
          setState("ready");
        } else if (!cancelled) setState("error");
      })
      .catch((error) => {
        console.error("PPTX preview error:", error);
        if (!cancelled) setState("error");
      });
    return () => { cancelled = true; };
  }, [file.id]);

  if (state === "loading") return <div className="p-6 text-sm text-white/70">Loading presentation...</div>;
  if (state === "error") return <Fallback message="This presentation could not be previewed." onDownload={onDownload} />;
  return <iframe src={url} title={file.name} className="h-full w-full bg-white" />;
}
