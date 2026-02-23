import { ChevronRight } from "lucide-react";

export default function Breadcrumb({ page, allPages, onSelectPage }) {
  if (!page) return null;

  // Build breadcrumb trail
  const trail = [];
  let current = page;

  while (current) {
    trail.unshift(current);
    current = allPages.find((p) => p.id === current.parent_id) || null;
  }

  if (trail.length <= 1) return null;

  return (
    <div className="flex items-center gap-1 text-gray-500 text-sm mb-4 flex-wrap">
      {trail.map((p, index) => (
        <span key={p.id} className="flex items-center gap-1">
          {index < trail.length - 1 ? (
            <button
              onClick={() => onSelectPage(p)}
              className="hover:text-white transition-colors"
            >
              {p.emoji || "📄"} {p.title || "Untitled"}
            </button>
          ) : (
            <span className="text-gray-400">
              {p.emoji || "📄"} {p.title || "Untitled"}
            </span>
          )}
          {index < trail.length - 1 && <ChevronRight size={14} />}
        </span>
      ))}
    </div>
  );
}