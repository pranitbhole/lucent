import { useState, useEffect, useRef } from "react";
import { Search, FileText, X, Clock } from "lucide-react";
import api from "../lib/api";

function highlight(text, query) {
  if (!query || !text) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-400/30 text-yellow-200 rounded px-0.5">
        {part}
      </mark>
    ) : part
  );
}

function getSnippet(content, query) {
  if (!content || !query) return "";
  const plain = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const idx = plain.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return plain.slice(0, 100) + "...";
  const start = Math.max(0, idx - 40);
  const end = Math.min(plain.length, idx + 80);
  return (start > 0 ? "..." : "") + plain.slice(start, end) + (end < plain.length ? "..." : "");
}

export default function SearchModal({ open, onClose, onSelectPage, workspaceId }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      const stored = JSON.parse(localStorage.getItem("recentPages") || "[]");
      setRecent(stored);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/pages/search/query?q=${encodeURIComponent(query)}&workspace_id=${workspaceId}`);
        setResults(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, workspaceId]);

  const handleSelect = (page) => {
    // Save to recent
    const stored = JSON.parse(localStorage.getItem("recentPages") || "[]");
    const updated = [page, ...stored.filter((p) => p.id !== page.id)].slice(0, 5);
    localStorage.setItem("recentPages", JSON.stringify(updated));
    onSelectPage(page);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-[#242424] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
          <Search size={16} className="text-gray-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages..."
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-gray-500 hover:text-white">
              <X size={14} />
            </button>
          )}
          <kbd className="text-gray-600 text-xs border border-gray-700 rounded px-1.5 py-0.5">Esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-gray-700 border-t-gray-400 rounded-full animate-spin" />
            </div>
          ) : query && results.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 text-sm">No results for "{query}"</p>
            </div>
          ) : query && results.length > 0 ? (
            <div className="p-2">
              <p className="text-gray-600 text-xs px-3 py-1.5 uppercase tracking-wider">
                {results.length} result{results.length > 1 ? "s" : ""}
              </p>
              {results.map((page) => (
                <button
                  key={page.id}
                  onClick={() => handleSelect(page)}
                  className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group"
                >
                  <div className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText size={13} className="text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {highlight(page.title || "Untitled", query)}
                    </p>
                    {page.content && (
                      <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">
                        {highlight(getSnippet(page.content, query), query)}
                      </p>
                    )}
                  </div>
                  <span className="text-gray-700 text-xs shrink-0 mt-0.5">
                    {new Date(page.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </button>
              ))}
            </div>
          ) : recent.length > 0 ? (
            <div className="p-2">
              <p className="text-gray-600 text-xs px-3 py-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={10} /> Recent
              </p>
              {recent.map((page) => (
                <button
                  key={page.id}
                  onClick={() => handleSelect(page)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center shrink-0">
                    <FileText size={13} className="text-gray-500" />
                  </div>
                  <span className="text-gray-300 text-sm truncate">{page.title || "Untitled"}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-600 text-sm">Type to search across all pages</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/5 px-4 py-2 flex items-center gap-4 text-gray-700 text-xs">
          <span className="flex items-center gap-1"><kbd className="border border-gray-700 rounded px-1">↵</kbd> Select</span>
          <span className="flex items-center gap-1"><kbd className="border border-gray-700 rounded px-1">Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}