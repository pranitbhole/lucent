import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import Editor from "../components/Editor";
import Breadcrumb from "../components/Breadcrumb";
import ExportMenu from "../components/ExportMenu";
import CoverImage from "../components/CoverImage";
import SearchModal from "../components/SearchModal";
import KanbanBoard from "../components/KanbanBoard";
import { Menu, FileText, Columns } from "lucide-react";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSidebarOpen(false);
      }
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
    setSidebarOpen(false);
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
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:z-auto
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <Sidebar
          activePage={activePage}
          onSelectPage={handleSelectPage}
          refreshTrigger={refreshTrigger}
          onWorkspaceChange={(id) => setActiveWorkspaceId(id)}
          onSearchOpen={() => { setSearchOpen(true); setSidebarOpen(false); }}
          onPageDeleted={(id) => setKanbanPages((prev) => prev.filter((p) => p.id !== id))}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top bar */}
        <div
          className="flex items-center justify-between px-4 md:px-6 py-2 shrink-0 border-b"
          style={{ background: "var(--bg-base)", borderColor: "var(--border)" }}
        >
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-1.5 rounded-lg transition-all duration-150"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            <Menu size={18} />
          </button>

          {/* Page title on mobile */}
          {activePage && (
            <p className="md:hidden text-sm truncate flex-1 mx-3" style={{ color: "var(--text-secondary)" }}>
              {activePage.title || "Untitled"}
            </p>
          )}

          {/* Spacer on desktop */}
          <div className="hidden md:block flex-1" />

          {/* View toggle */}
          <div
            className="flex items-center gap-0.5 p-1 rounded-lg border"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
          >
            <button
              onClick={() => setView("editor")}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150"
              style={{
                background: view === "editor" ? "var(--bg-hover)" : "transparent",
                color: view === "editor" ? "var(--text-primary)" : "var(--text-muted)",
              }}
            >
              <FileText size={12} />
              <span className="hidden sm:inline">Pages</span>
            </button>
            <button
              onClick={() => { setView("kanban"); setKanbanPages(allPages); }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150"
              style={{
                background: view === "kanban" ? "var(--bg-hover)" : "transparent",
                color: view === "kanban" ? "var(--text-primary)" : "var(--text-muted)",
              }}
            >
              <Columns size={12} />
              <span className="hidden sm:inline">Kanban</span>
            </button>
          </div>
        </div>

        {/* Content area */}
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
          <div className="flex-1 flex flex-col overflow-y-auto fade-up" style={{ background: "var(--bg-base)" }}>
            <div className="max-w-3xl mx-auto w-full px-4 sm:px-8 md:px-12 py-6 md:py-12 flex flex-col flex-1">

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
                className="bg-transparent border-none outline-none w-full font-bold text-white placeholder-[#333]"
                style={{
                  fontSize: "clamp(1.6rem, 4vw, 2.25rem)",
                  letterSpacing: "-0.03em",
                  lineHeight: "1.2",
                  marginBottom: "12px",
                  fontFamily: "inherit",
                }}
              />

              {/* Meta row */}
              <div
                className="flex items-center justify-between pb-4 mb-8 border-b"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="flex items-center gap-2.5 text-xs" style={{ color: "var(--text-muted)" }}>
                  <span className="font-mono">
                    {content.replace(/<[^>]+>/g, "").trim().split(/\s+/).filter(Boolean).length}
                    <span className="ml-1">words</span>
                  </span>
                  <span style={{ color: "var(--border)" }}>·</span>
                  {saving ? (
                    <span style={{ color: "var(--text-muted)" }}>Saving...</span>
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
          /* Empty state */
          <div
            className="flex-1 flex flex-col items-center justify-center text-center px-8 fade-up"
            style={{ background: "var(--bg-base)" }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 border"
              style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
            >
              <FileText size={22} style={{ color: "var(--text-muted)" }} />
            </div>
            <h2 className="text-white text-base font-semibold mb-2" style={{ letterSpacing: "-0.02em" }}>
              No page selected
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)", maxWidth: "220px" }}>
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