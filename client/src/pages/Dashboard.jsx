import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import Editor from "../components/Editor";
import Breadcrumb from "../components/Breadcrumb";
import ExportMenu from "../components/ExportMenu";
import CoverImage from "../components/CoverImage";
import SearchModal from "../components/SearchModal";
import KanbanBoard from "../components/KanbanBoard";
import api from "../lib/api";

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Dashboard() {
  const [activePage, setActivePage] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [allPages, setAllPages] = useState([]);
  const [coverImage, setCoverImage] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
  const [view, setView] = useState("editor");
  const [kanbanPages, setKanbanPages] = useState([]);

  const debouncedTitle = useDebounce(title, 800);
  const debouncedContent = useDebounce(content, 800);

  useEffect(() => {
    const fetchAll = async () => {
      if (!activeWorkspaceId) return;
      try {
        const res = await api.get(`/pages?workspace_id=${activeWorkspaceId}`);
        setAllPages(res.data);
        setKanbanPages(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAll();
  }, [refreshTrigger, activeWorkspaceId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelectPage = (page) => {
    setActivePage(page);
    setTitle(page?.title || "");
    setContent(page?.content || "");
    setCoverImage(page?.cover_image || null);
    setSavedAt(page?.updated_at || null);
  };

  const savePage = useCallback(async () => {
    if (!activePage) return;
    setSaving(true);
    try {
      const res = await api.put(`/pages/${activePage.id}`, {
        title: debouncedTitle,
        content: debouncedContent,
        cover_image: coverImage,
      });
      setSavedAt(res.data.updated_at);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }, [activePage, debouncedTitle, debouncedContent, coverImage]);

  useEffect(() => {
    if (activePage) savePage();
  }, [debouncedTitle, debouncedContent, coverImage]);

  return (
    <div className="flex h-screen bg-[#191919]">
      <Sidebar
        activePage={activePage}
        onSelectPage={handleSelectPage}
        refreshTrigger={refreshTrigger}
        onWorkspaceChange={(id) => setActiveWorkspaceId(id)}
        onSearchOpen={() => setSearchOpen(true)}
        onPageDeleted={(id) => setKanbanPages((prev) => prev.filter((p) => p.id !== id))}

      />

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar with view toggle */}
        <div className="flex items-center justify-end px-6 py-2 border-b border-white/5 bg-[#191919] shrink-0">
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setView("editor")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                view === "editor"
                  ? "bg-white/10 text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              📄 Pages
            </button>
            <button
              onClick={() => {
                setView("kanban");
                setKanbanPages(allPages);
              }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                view === "kanban"
                  ? "bg-white/10 text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              📋 Kanban
            </button>
          </div>
        </div>

        {/* Main content */}
        {view === "kanban" ? (
            <KanbanBoard
            pages={kanbanPages}
            setPages={setKanbanPages}
            onSelectPage={(page) => {
                handleSelectPage(page);
                setView("editor");
            }}
            workspaceId={activeWorkspaceId}
            onDelete={() => setRefreshTrigger((prev) => prev + 1)}
            onStar={() => setRefreshTrigger((prev) => prev + 1)}
            />
        ) : activePage ? (
          <div className="flex-1 flex flex-col overflow-y-auto bg-[#191919]">
            <div className="max-w-3xl mx-auto w-full px-12 py-10 flex flex-col flex-1">

              {/* Cover Image */}
              <CoverImage
                coverImage={coverImage}
                onCoverChange={(url) => setCoverImage(url)}
              />

              {/* Breadcrumb */}
              <Breadcrumb
                page={activePage}
                allPages={allPages}
                onSelectPage={handleSelectPage}
              />

              {/* Title */}
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled"
                className="text-4xl font-bold text-white bg-transparent border-none outline-none mb-2 placeholder-gray-700 w-full tracking-tight"
              />

              {/* Meta row */}
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3 text-gray-600 text-xs">
                  <span>
                    {content.replace(/<[^>]+>/g, "").trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                  <span>·</span>
                  {saving ? (
                    <span className="text-gray-500">Saving...</span>
                  ) : savedAt ? (
                    <span>Saved {timeAgo(savedAt)}</span>
                  ) : null}
                </div>
                <ExportMenu title={title} content={content} />
              </div>

              {/* Editor */}
              <Editor
                content={content}
                onChange={(val) => setContent(val)}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 bg-[#191919]">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
              <span className="text-3xl">📝</span>
            </div>
            <h2 className="text-white text-xl font-semibold mb-2 tracking-tight">
              No page selected
            </h2>
            <p className="text-gray-600 text-sm max-w-xs leading-relaxed">
              Select a page from the sidebar or create a new one to start writing.
            </p>
          </div>
        )}
      </div>

      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectPage={handleSelectPage}
        workspaceId={activeWorkspaceId}
      />
    </div>
  );
}