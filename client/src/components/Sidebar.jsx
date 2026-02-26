import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import {
  Plus, Trash2, LogOut, Search, ChevronRight, ChevronDown,
  FileText, Star, Settings, ChevronsLeft, SquarePen, Home, Check, X
} from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortablePageItem({ page, allPages, activePage, onSelectPage, onDelete, onAddSubPage, onStar, depth = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const children = allPages.filter((p) => p.parent_id === page.id);
  const hasChildren = children.length > 0;
  const isActive = activePage?.id === page.id;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    paddingLeft: `${depth * 12 + 4}px`,
  };

  return (
    <div>
      <div
        ref={setNodeRef}
        style={{
          ...style,
          background: isActive ? "var(--bg-active)" : "transparent",
        }}
        className="flex items-center justify-between px-2 py-1 rounded-lg cursor-pointer group mb-0.5 transition-all duration-100"
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--bg-hover)"; }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
      >
        <div
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab active:cursor-grabbing mr-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: "var(--text-muted)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <svg width="8" height="14" viewBox="0 0 10 16" fill="currentColor">
            <circle cx="2" cy="3" r="1.5" /><circle cx="8" cy="3" r="1.5" />
            <circle cx="2" cy="8" r="1.5" /><circle cx="8" cy="8" r="1.5" />
            <circle cx="2" cy="13" r="1.5" /><circle cx="8" cy="13" r="1.5" />
          </svg>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(p => !p); }}
          className={`shrink-0 mr-0.5 transition-colors ${hasChildren ? "visible" : "invisible"}`}
          style={{ color: "var(--text-muted)" }}
        >
          {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        </button>

        <div className="flex items-center gap-1.5 truncate flex-1 min-w-0" onClick={() => onSelectPage(page)}>
          <FileText size={12} className="shrink-0" style={{ color: "var(--text-muted)" }} />
          <span className="text-sm truncate" style={{ color: isActive ? "var(--text-primary)" : "var(--text-secondary)" }}>
            {page.title || "Untitled"}
          </span>
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onStar(page.id); }}
            className="p-0.5 rounded transition-colors"
            style={{ color: page.is_starred ? "var(--accent-yellow)" : "var(--text-muted)" }}
          >
            <Star size={11} fill="none" strokeWidth={2} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onAddSubPage(page.id); setExpanded(true); }}
            className="p-0.5 rounded transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <Plus size={11} />
          </button>
          <button
            onClick={(e) => onDelete(e, page.id)}
            className="p-0.5 rounded transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--accent-red)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {expanded && hasChildren && (
        <div>
          {children.map((child) => (
            <SortablePageItem
              key={child.id}
              page={child}
              allPages={allPages}
              activePage={activePage}
              onSelectPage={onSelectPage}
              onDelete={onDelete}
              onAddSubPage={onAddSubPage}
              onStar={onStar}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── New Workspace Modal ────────────────────────────────────────
function NewWorkspaceModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await onCreate(name.trim());
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-sm rounded-2xl border p-5 shadow-2xl fade-up"
        style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">New workspace</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              Workspace name
            </label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Personal, Work, Side Projects..."
              className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-[#444] outline-none transition-all duration-150 border"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
              onFocus={e => e.target.style.borderColor = "var(--border-hover)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-150 border"
              style={{ color: "var(--text-secondary)", borderColor: "var(--border)", background: "transparent" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="flex-1 py-2 rounded-lg text-sm font-medium text-black bg-white transition-all duration-150 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────
export default function Sidebar({ activePage, onSelectPage, refreshTrigger, onWorkspaceChange, onSearchOpen, onPageDeleted }) {
  const [pages, setPages] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [wsDropdownOpen, setWsDropdownOpen] = useState(false);
  const [newWsModalOpen, setNewWsModalOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => { fetchWorkspaces(); }, []);
  useEffect(() => { if (activeWorkspace) fetchPages(); }, [activeWorkspace, refreshTrigger]);

  const fetchWorkspaces = async () => {
    try {
      const res = await api.get("/workspaces");
      if (res.data.length === 0) {
        const created = await api.post("/workspaces", { name: `${user?.email?.split("@")[0]}'s Space`, icon: "🗂️" });
        setWorkspaces([created.data]);
        setActiveWorkspace(created.data);
        if (onWorkspaceChange) onWorkspaceChange(created.data.id);
      } else {
        setWorkspaces(res.data);
        setActiveWorkspace(res.data[0]);
        if (onWorkspaceChange) onWorkspaceChange(res.data[0].id);
      }
    } catch (err) { console.error(err); }
  };

  const fetchPages = async () => {
    try {
      const res = await api.get(`/pages?workspace_id=${activeWorkspace.id}`);
      setPages(res.data);
    } catch (err) { console.error(err); }
  };

  const createPage = async (parentId = null) => {
    try {
      const res = await api.post("/pages", { title: "Untitled", content: "", parent_id: parentId, workspace_id: activeWorkspace.id });
      setPages((prev) => [...prev, res.data]);
      onSelectPage(res.data);
    } catch (err) { console.error(err); }
  };

  const deletePage = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/pages/${id}`);
      setPages((prev) => prev.filter((p) => p.id !== id));
      if (activePage?.id === id) onSelectPage(null);
      if (onPageDeleted) onPageDeleted(id);
    } catch (err) { console.error(err); }
  };

  const starPage = async (id) => {
    try {
      const res = await api.put(`/pages/star/${id}`);
      setPages((prev) => prev.map((p) => p.id === id ? { ...p, is_starred: res.data.is_starred } : p));
    } catch (err) { console.error(err); }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const rootPages = pages.filter((p) => p.parent_id === null);
    const oldIndex = rootPages.findIndex((p) => p.id === active.id);
    const newIndex = rootPages.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(rootPages, oldIndex, newIndex);
    setPages([...reordered, ...pages.filter((p) => p.parent_id !== null)]);
    try {
      await api.put("/pages/reorder/bulk", { pages: reordered.map((p, i) => ({ id: p.id, position: i })) });
    } catch (err) { fetchPages(); }
  };

  const handleWorkspaceSwitch = (ws) => {
    setActiveWorkspace(ws);
    onSelectPage(null);
    setPages([]);
    setWsDropdownOpen(false);
    if (onWorkspaceChange) onWorkspaceChange(ws.id);
  };

  const handleCreateWorkspace = async (name) => {
    try {
      const res = await api.post("/workspaces", { name, icon: "🗂️" });
      setWorkspaces(prev => [...prev, res.data]);
      handleWorkspaceSwitch(res.data);
      setWsDropdownOpen(false);
    } catch (err) { console.error(err); }
  };

  const rootPages = pages.filter((p) => p.parent_id === null);
  const starredPages = pages.filter((p) => p.is_starred);
  const initials = activeWorkspace?.name?.charAt(0).toUpperCase() || "W";

  if (collapsed) {
    return (
      <div className="w-12 h-screen flex flex-col items-center py-4 gap-3 border-r" style={{ background: "var(--bg-base)", borderColor: "var(--border)" }}>
        <button onClick={() => setCollapsed(false)} className="p-2 rounded-lg transition-colors" style={{ color: "var(--text-muted)" }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}>
          <ChevronRight size={16} />
        </button>
        <button onClick={() => createPage(null)} className="p-2 rounded-lg transition-colors" style={{ color: "var(--text-muted)" }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}>
          <SquarePen size={15} />
        </button>
        <button onClick={onSearchOpen} className="p-2 rounded-lg transition-colors" style={{ color: "var(--text-muted)" }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}>
          <Search size={15} />
        </button>
        <button onClick={() => navigate("/trash")} className="p-2 rounded-lg transition-colors mt-auto" style={{ color: "var(--text-muted)" }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}>
          <Trash2 size={15} />
        </button>
      </div>
    );
  }

  return (
    <>
      {/* New Workspace Modal */}
      {newWsModalOpen && (
        <NewWorkspaceModal
          onClose={() => setNewWsModalOpen(false)}
          onCreate={handleCreateWorkspace}
        />
      )}

      <div className="w-60 h-screen flex flex-col border-r" style={{ background: "var(--bg-base)", borderColor: "var(--border)" }}>

        {/* Workspace Header */}
        <div className="px-3 pt-3 pb-2 relative">
          <div className="flex items-center justify-between group">
            <button
              onClick={() => setWsDropdownOpen(p => !p)}
              className="flex items-center gap-2 flex-1 min-w-0 px-2 py-1.5 rounded-lg transition-all duration-100"
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-semibold text-white shrink-0"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                {initials}
              </div>
              <span className="text-sm font-medium text-white truncate flex-1 text-left">
                {activeWorkspace?.name || "Workspace"}
              </span>
              <ChevronDown size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            </button>

            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
              <button onClick={() => createPage(null)}
                className="p-1.5 rounded-lg transition-all duration-100"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}>
                <SquarePen size={13} />
              </button>
              <button onClick={() => setCollapsed(true)}
                className="p-1.5 rounded-lg transition-all duration-100"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}>
                <ChevronsLeft size={13} />
              </button>
            </div>
          </div>

          {/* Workspace Dropdown */}
          {wsDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setWsDropdownOpen(false)} />
              <div className="absolute left-0 top-12 w-60 rounded-xl border shadow-2xl z-50 overflow-hidden"
                style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>

                {/* User email */}
                <div className="px-3 py-2 border-b" style={{ borderColor: "var(--border)" }}>
                  <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{user?.email}</p>
                </div>

                {/* Workspace list */}
                <div className="p-1">
                  {workspaces.map((ws) => (
                    <button key={ws.id} onClick={() => handleWorkspaceSwitch(ws)}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left transition-all duration-100"
                      onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <div className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-semibold text-white shrink-0"
                        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                        {ws.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-white truncate flex-1">{ws.name}</span>
                      {activeWorkspace?.id === ws.id && (
                        <Check size={12} style={{ color: "var(--accent-blue)", flexShrink: 0 }} />
                      )}
                    </button>
                  ))}
                </div>

                {/* Actions */}
                <div className="border-t p-1" style={{ borderColor: "var(--border)" }}>
                  <button
                    onClick={() => { setWsDropdownOpen(false); setNewWsModalOpen(true); }}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-all duration-100"
                    style={{ color: "var(--text-secondary)" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                  >
                    <Plus size={13} />
                    New workspace
                  </button>
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-all duration-100"
                    style={{ color: "var(--text-secondary)" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--accent-red)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                  >
                    <LogOut size={13} />
                    Log out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Nav Items */}
        <div className="px-3 py-1 space-y-0.5">
          {[
            { icon: Search, label: "Search", onClick: onSearchOpen, shortcut: "⌘K" },
            { icon: Home, label: "Home", onClick: () => onSelectPage(null) },
            { icon: Trash2, label: "Trash", onClick: () => navigate("/trash") },
          ].map(({ icon: Icon, label, onClick, shortcut }) => (
            <button key={label} onClick={onClick}
              className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-lg text-sm transition-all duration-100"
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}
            >
              <Icon size={14} className="shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              {shortcut && (
                <kbd className="text-xs px-1 py-0.5 rounded border font-mono"
                  style={{ color: "var(--text-muted)", borderColor: "var(--border)", background: "var(--bg-elevated)", fontSize: "10px" }}>
                  {shortcut}
                </kbd>
              )}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="mx-3 my-2 border-t" style={{ borderColor: "var(--border)" }} />

        {/* Pages */}
        <div className="flex-1 overflow-y-auto px-3">

          {/* Starred */}
          {starredPages.length > 0 && (
            <div className="mb-3">
              <p className="text-xs uppercase tracking-wider px-2 py-1.5 font-medium" style={{ color: "var(--text-muted)" }}>
                Starred
              </p>
              {starredPages.map((page) => (
                <div key={page.id}
                  onClick={() => onSelectPage(page)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer group mb-0.5 transition-all duration-100"
                  style={{ background: activePage?.id === page.id ? "var(--bg-active)" : "transparent" }}
                  onMouseEnter={e => { if (activePage?.id !== page.id) e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={e => { if (activePage?.id !== page.id) e.currentTarget.style.background = "transparent"; }}
                >
                  <button onClick={(e) => { e.stopPropagation(); starPage(page.id); }}
                    className="shrink-0" style={{ color: "var(--accent-yellow)" }}>
                    <Star size={11} fill="none" strokeWidth={2} />
                  </button>
                  <span className="text-sm truncate flex-1" style={{ color: "var(--text-secondary)" }}>
                    {page.title || "Untitled"}
                  </span>
                </div>
              ))}
              <div className="border-t my-2" style={{ borderColor: "var(--border)" }} />
            </div>
          )}

          {/* Private pages */}
          <div className="flex items-center justify-between px-2 py-1.5 group/header">
            <p className="text-xs uppercase tracking-wider font-medium" style={{ color: "var(--text-muted)" }}>Private</p>
            <button onClick={() => createPage(null)}
              className="opacity-0 group-hover/header:opacity-100 transition-opacity p-0.5 rounded"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
            >
              <Plus size={12} />
            </button>
          </div>

          {rootPages.length === 0 ? (
            <div className="px-2 py-4 text-center">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>No pages yet</p>
              <button onClick={() => createPage(null)}
                className="mt-2 text-xs flex items-center gap-1 mx-auto transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
              >
                <Plus size={11} /> Add a page
              </button>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={rootPages.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                {rootPages.map((page) => (
                  <SortablePageItem
                    key={page.id}
                    page={page}
                    allPages={pages}
                    activePage={activePage}
                    onSelectPage={onSelectPage}
                    onDelete={deletePage}
                    onAddSubPage={createPage}
                    onStar={starPage}
                    depth={0}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}

          <button onClick={() => createPage(null)}
            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-sm mt-1 transition-all duration-100"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            <Plus size={12} /> Add a page
          </button>
        </div>

        {/* Bottom — Settings */}
        <div className="px-3 py-2 border-t" style={{ borderColor: "var(--border)" }}>
          <button className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-sm transition-all duration-100"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            <Settings size={13} /> Settings
          </button>
        </div>
      </div>
    </>
  );
}