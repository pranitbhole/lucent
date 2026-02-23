import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import {
  Plus, Trash2, LogOut,
  Search, ChevronRight, ChevronDown,
  FileText, Star, Settings, ChevronsLeft,
  SquarePen, Home
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortablePageItem({ page, allPages, activePage, onSelectPage, onDelete, onAddSubPage, onStar, depth = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const children = allPages.filter((p) => p.parent_id === page.id);
  const hasChildren = children.length > 0;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    paddingLeft: `${depth * 12 + 4}px`,
  };

  return (
    <div>
      <div
        ref={setNodeRef}
        style={style}
        className={`flex items-center justify-between px-2 py-1 rounded-md cursor-pointer group mb-0.5 ${
          activePage?.id === page.id
            ? "bg-gray-700 text-white"
            : "text-gray-400 hover:bg-gray-700/50 hover:text-white"
        }`}
      >
        <div
          {...attributes}
          {...listeners}
          className="shrink-0 text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing mr-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <svg width="8" height="14" viewBox="0 0 10 16" fill="currentColor">
            <circle cx="2" cy="3" r="1.5" />
            <circle cx="8" cy="3" r="1.5" />
            <circle cx="2" cy="8" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="2" cy="13" r="1.5" />
            <circle cx="8" cy="13" r="1.5" />
          </svg>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); setExpanded((prev) => !prev); }}
          className={`shrink-0 text-gray-500 hover:text-white mr-0.5 ${hasChildren ? "visible" : "invisible"}`}
        >
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>

        <div
          className="flex items-center gap-1.5 truncate flex-1 min-w-0"
          onClick={() => onSelectPage(page)}
        >
          <FileText size={13} className="shrink-0 text-gray-500" />
          <span className="text-sm truncate">{page.title || "Untitled"}</span>
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onStar(page.id); }}
            className={`p-0.5 rounded transition-colors ${page.is_starred ? "text-yellow-400" : "text-gray-600 hover:text-gray-300"}`}
          >
            <Star size={12} fill="none" strokeWidth={2} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onAddSubPage(page.id); setExpanded(true); }}
            className="p-0.5 rounded text-gray-500 hover:text-white"
          >
            <Plus size={12} />
          </button>
          <button
            onClick={(e) => onDelete(e, page.id)}
            className="p-0.5 rounded text-gray-500 hover:text-red-400"
          >
            <Trash2 size={12} />
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

export default function Sidebar({ activePage, onSelectPage, refreshTrigger, onWorkspaceChange, onSearchOpen, onPageDeleted  }) {
  const [pages, setPages] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [wsDropdownOpen, setWsDropdownOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => { fetchWorkspaces(); }, []);
  useEffect(() => { if (activeWorkspace) fetchPages(); }, [activeWorkspace, refreshTrigger]);

  const fetchWorkspaces = async () => {
    try {
      const res = await api.get("/workspaces");
      if (res.data.length === 0) {
        const created = await api.post("/workspaces", {
          name: `${user?.email?.split("@")[0]}'s Space`,
          icon: "🗂️"
        });
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
      const res = await api.post("/pages", {
        title: "Untitled",
        content: "",
        parent_id: parentId,
        workspace_id: activeWorkspace.id,
      });
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
      if (onPageDeleted) onPageDeleted(id); // ← add this

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
      await api.put("/pages/reorder/bulk", {
        pages: reordered.map((p, i) => ({ id: p.id, position: i })),
      });
    } catch (err) { fetchPages(); }
  };

  const handleWorkspaceSwitch = (ws) => {
    setActiveWorkspace(ws);
    onSelectPage(null);
    setPages([]);
    setWsDropdownOpen(false);
    if (onWorkspaceChange) onWorkspaceChange(ws.id);
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  const rootPages = pages.filter((p) => p.parent_id === null);
  const starredPages = pages.filter((p) => p.is_starred);
  const initials = activeWorkspace?.name?.charAt(0).toUpperCase() || "W";

  if (collapsed) {
    return (
      <div className="w-12 h-screen bg-[#191919] border-r border-gray-800 flex flex-col items-center py-4 gap-4">
        <button onClick={() => setCollapsed(false)} className="text-gray-400 hover:text-white">
          <ChevronRight size={18} />
        </button>
        <button onClick={() => createPage(null)} className="text-gray-400 hover:text-white">
          <SquarePen size={16} />
        </button>
        <button onClick={onSearchOpen} className="text-gray-400 hover:text-white">
          <Search size={16} />
        </button>
        <button onClick={() => navigate("/trash")} className="text-gray-400 hover:text-white mt-auto">
          <Trash2 size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 h-screen bg-[#191919] border-r border-gray-800 flex flex-col">

      {/* Workspace Header */}
      <div className="px-3 pt-3 pb-1 relative">
        <div className="flex items-center justify-between group">
          <button
            onClick={() => setWsDropdownOpen((p) => !p)}
            className="flex items-center gap-2 flex-1 min-w-0 px-2 py-1.5 rounded-md hover:bg-gray-700/50 transition-colors"
          >
            <div className="w-5 h-5 rounded bg-gray-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {initials}
            </div>
            <span className="text-white text-sm font-semibold truncate">
              {activeWorkspace?.name || "My Workspace"}
            </span>
            <ChevronDown size={13} className="text-gray-400 shrink-0" />
          </button>

          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => createPage(null)}
              className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
              title="New page"
            >
              <SquarePen size={14} />
            </button>
            <button
              onClick={() => setCollapsed(true)}
              className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
              title="Collapse sidebar"
            >
              <ChevronsLeft size={14} />
            </button>
          </div>
        </div>

        {/* Workspace Dropdown */}
        {wsDropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setWsDropdownOpen(false)} />
            <div className="absolute left-0 top-12 w-64 bg-[#2d2d2d] border border-gray-700 rounded-lg shadow-2xl z-50 overflow-hidden">
              <div className="p-2 border-b border-gray-700">
                <p className="text-gray-400 text-xs px-2 py-0.5">{user?.email}</p>
              </div>
              <div className="py-1">
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => handleWorkspaceSwitch(ws)}
                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-700 text-left"
                  >
                    <div className="w-5 h-5 rounded bg-gray-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {ws.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white text-sm truncate flex-1">{ws.name}</span>
                    {activeWorkspace?.id === ws.id && (
                      <span className="text-blue-400 text-xs">✓</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="border-t border-gray-700 py-1">
                <button
                  onClick={async () => {
                    const name = prompt("Workspace name:");
                    if (!name) return;
                    const res = await api.post("/workspaces", { name, icon: "🗂️" });
                    setWorkspaces((prev) => [...prev, res.data]);
                    handleWorkspaceSwitch(res.data);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-700 text-gray-400 hover:text-white text-sm"
                >
                  <Plus size={14} />
                  New workspace
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-700 text-gray-400 hover:text-white text-sm"
                >
                  <LogOut size={14} />
                  Log out
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Nav Items */}
      <div className="px-3 py-1 space-y-0.5">
        <button
          onClick={onSearchOpen}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-gray-400 hover:bg-gray-700/50 hover:text-white text-sm transition-colors"
        >
          <Search size={15} className="shrink-0" />
          <span className="flex-1 text-left">Search</span>
          <kbd className="text-gray-700 text-xs border border-gray-700 rounded px-1">⌘K</kbd>
        </button>
        <button
          onClick={() => onSelectPage(null)}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-gray-400 hover:bg-gray-700/50 hover:text-white text-sm transition-colors"
        >
          <Home size={15} className="shrink-0" />
          Home
        </button>
        <button
          onClick={() => navigate("/trash")}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-gray-400 hover:bg-gray-700/50 hover:text-white text-sm transition-colors"
        >
          <Trash2 size={15} className="shrink-0" />
          Trash
        </button>
      </div>

      {/* Pages List */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <>
          {/* Starred */}
          {starredPages.length > 0 && (
            <div className="mb-2">
              <p className="text-gray-500 text-xs uppercase tracking-wider px-2 py-1">Starred</p>
              {starredPages.map((page) => (
                <div
                  key={page.id}
                  onClick={() => onSelectPage(page)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer group mb-0.5 ${
                    activePage?.id === page.id ? "bg-gray-700 text-white" : "text-gray-400 hover:bg-gray-700/50 hover:text-white"
                  }`}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); starPage(page.id); }}
                    className="text-yellow-400 hover:text-gray-400 shrink-0"
                  >
                    <Star size={12} fill="none" strokeWidth={2} />
                  </button>
                  <span className="text-sm truncate">{page.title || "Untitled"}</span>
                </div>
              ))}
              <div className="border-b border-gray-800 my-2" />
            </div>
          )}

          {/* Private Pages */}
          <div className="flex items-center justify-between px-2 py-1 group/header">
            <p className="text-gray-500 text-xs uppercase tracking-wider">Private</p>
            <button
              onClick={() => createPage(null)}
              className="opacity-0 group-hover/header:opacity-100 text-gray-500 hover:text-white transition-opacity"
            >
              <Plus size={13} />
            </button>
          </div>

          {rootPages.length === 0 ? (
            <div className="px-2 py-3 text-center">
              <p className="text-gray-600 text-xs">No pages yet</p>
              <button
                onClick={() => createPage(null)}
                className="mt-2 text-gray-500 hover:text-white text-xs flex items-center gap-1 mx-auto"
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

          <button
            onClick={() => createPage(null)}
            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-gray-600 hover:text-gray-400 hover:bg-gray-700/50 text-sm mt-1 transition-colors"
          >
            <Plus size={13} />
            Add a page
          </button>
        </>
      </div>

      {/* Bottom */}
      <div className="px-3 py-2 border-t border-gray-800">
        <button className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-gray-500 hover:bg-gray-700/50 hover:text-white text-sm transition-colors">
          <Settings size={14} />
          Settings
        </button>
      </div>
    </div>
  );
}