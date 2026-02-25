import { useState, useEffect, useRef } from "react";
import { Search, FileText, X, Clock, ArrowRight } from "lucide-react";
import api from "../lib/api";

function highlight(text, query) {
  if (!query || !text) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} style={{ background: "rgba(59,130,246,0.25)", color: "#93c5fd", borderRadius: "3px", padding: "0 2px" }}>
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
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      const stored = JSON.parse(localStorage.getItem("recentPages") || "[]");
      setRecent(stored);
      setActiveIndex(0);
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
        setActiveIndex(0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, workspaceId]);

  const displayItems = query ? results : recent;

  const handleSelect = (page) => {
    const stored = JSON.parse(localStorage.getItem("recentPages") || "[]");
    const updated = [page, ...stored.filter((p) => p.id !== page.id)].slice(0, 5);
    localStorage.setItem("recentPages", JSON.stringify(updated));
    onSelectPage(page);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, displayItems.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && displayItems[activeIndex]) handleSelect(displayItems[activeIndex]);
    if (e.key === "Escape") onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-2xl border overflow-hidden shadow-2xl fade-up"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>

        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b" style={{ borderColor: "var(--border)" }}>
          <Search size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages..."
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder-[#444]"
          />
          {query ? (
            <button onClick={() => setQuery("")} className="transition-colors" style={{ color: "var(--text-muted)" }}>
              <X size={13} />
            </button>
          ) : (
            <kbd className="text-xs px-1.5 py-0.5 rounded border font-mono" style={{ color: "var(--text-muted)", borderColor: "var(--border)", background: "var(--bg-elevated)" }}>Esc</kbd>
          )}
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "var(--border)", borderTopColor: "var(--text-secondary)" }} />
            </div>
          ) : displayItems.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {query ? `No results for "${query}"` : "Type to search"}
              </p>
            </div>
          ) : (
            <div className="p-1.5">
              {!query && recent.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-2">
                  <Clock size={11} style={{ color: "var(--text-muted)" }} />
                  <span className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Recent</span>
                </div>
              )}
              {query && results.length > 0 && (
                <div className="px-3 py-2">
                  <span className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    {results.length} result{results.length > 1 ? "s" : ""}
                  </span>
                </div>
              )}
              {displayItems.map((page, i) => (
                <button
                  key={page.id}
                  onClick={() => handleSelect(page)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-100 group"
                  style={{ background: i === activeIndex ? "var(--bg-hover)" : "transparent" }}
                  onMouseEnter={() => setActiveIndex(i)}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center border shrink-0" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
                    <FileText size={12} style={{ color: "var(--text-muted)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">
                      {query ? highlight(page.title || "Untitled", query) : (page.title || "Untitled")}
                    </p>
                    {query && page.content && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                        {highlight(getSnippet(page.content, query), query)}
                      </p>
                    )}
                  </div>
                  <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" style={{ color: "var(--text-muted)" }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t" style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}>
          {[["↑↓", "Navigate"], ["↵", "Open"], ["Esc", "Close"]].map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <kbd className="text-xs px-1.5 py-0.5 rounded border font-mono" style={{ color: "var(--text-muted)", borderColor: "var(--border)", background: "var(--bg-surface)" }}>{key}</kbd>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}