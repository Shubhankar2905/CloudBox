import {
  Archive,
  FileText,
  Image,
  PlaySquare,
  ArrowUpRight,
} from "lucide-react";

const categories = [
  {
    label: "Images",
    files: "248 files",
    size: "2.4 GB",
    icon: Image,
    color: "bg-[#f1eaff] text-[#8b5cf6]",
  },
  {
    label: "Media",
    files: "56 files",
    size: "8.2 GB",
    icon: PlaySquare,
    color: "bg-[#e8f1ff] text-[#246bfe]",
  },
  {
    label: "Documents",
    files: "120 files",
    size: "1.8 GB",
    icon: FileText,
    color: "bg-[#fff4df] text-[#e59a12]",
  },
  {
    label: "Others",
    files: "34 files",
    size: "500 MB",
    icon: Archive,
    color: "bg-[#e9f8f2] text-[#18a66a]",
  },
];

export function FileOverview() {
  return (
    <section aria-labelledby="overview-heading" className="mb-9">
      <div className="mb-4 flex items-center justify-between">
        <h2
          id="overview-heading"
          className="text-[17px] font-semibold text-[#1d2939]"
        >
          Quick Access
        </h2>
        <span className="text-xs text-[#98a2b3]">Across all files</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {categories.map(({ label, files, size, icon: Icon, color }) => (
          <button
            key={label}
            className="group rounded-xl border border-[#e4e8ee] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#b8cdf7] hover:shadow-[0_6px_16px_rgba(25,65,125,0.07)]"
          >
            <div
              className={`mb-5 grid size-10 place-items-center rounded-lg ${color}`}
            >
              <Icon className="size-5" strokeWidth={1.8} />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#344054]">
                  {label}
                </h3>
                <p className="mt-1 text-xs text-[#98a2b3]">
                  {files} <span className="mx-1 text-[#d0d5dd]">•</span> {size}
                </p>
              </div>
              <ArrowUpRight className="size-4 text-[#c2cbd8] transition group-hover:text-[#246bfe]" />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
