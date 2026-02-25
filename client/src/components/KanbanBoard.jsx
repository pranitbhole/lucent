import { useState } from "react";
import { Plus, FileText, Star, Trash2 } from "lucide-react";
import api from "../lib/api";

const COLUMNS = [
  { id: "todo",        label: "To Do",       dot: "#6b7280", bg: "rgba(107,114,128,0.08)" },
  { id: "in_progress", label: "In Progress",  dot: "#3b82f6", bg: "rgba(59,130,246,0.08)"  },
  { id: "done",        label: "Done",         dot: "#22c55e", bg: "rgba(34,197,94,0.08)"   },
];

function KanbanCard({ page, onSelectPage, onDelete, onStar, onDragStart }) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, page)}
      onClick={() => onSelectPage(page)}
      className="rounded-xl border p-3.5 group cursor-pointer select-none transition-all duration-150"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-white leading-snug flex-1 min-w-0 truncate">
          {page.title || "Untitled"}
        </p>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onStar(page.id); }}
            className="p-1 rounded-md transition-colors"
            style={{ color: page.is_starred ? "var(--accent-yellow)" : "var(--text-muted)" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <Star size={11} fill="none" strokeWidth={2} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(e, page.id); }}
            className="p-1 rounded-md transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; e.currentTarget.style.color = "var(--accent-red)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {page.content && (
        <p className="text-xs mt-1.5 line-clamp-2 leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {page.content.replace(/<[^>]+>/g, "").trim().slice(0, 100)}
        </p>
      )}

      <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t" style={{ borderColor: "var(--border)" }}>
        <FileText size={10} style={{ color: "var(--text-muted)" }} />
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {new Date(page.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>
    </div>
  );
}

function KanbanColumn({ column, pages, onSelectPage, onDelete, onStar, onAddPage, onDragStart, onDrop, onDragOver }) {
  const [isOver, setIsOver] = useState(false);

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: column.dot }} />
          <span className="text-sm font-medium text-white">{column.label}</span>
          <span className="text-xs px-1.5 py-0.5 rounded-md font-mono" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
            {pages.length}
          </span>
        </div>
        <button
          onClick={() => onAddPage(column.id)}
          className="p-1 rounded-md transition-all duration-150"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsOver(true); onDragOver(e); }}
        onDragLeave={() => setIsOver(false)}
        onDrop={(e) => { setIsOver(false); onDrop(e, column.id); }}
        className="flex flex-col gap-2 flex-1 min-h-48 rounded-xl p-2 transition-all duration-150 border"
        style={{
          background: isOver ? column.bg : "transparent",
          borderColor: isOver ? column.dot + "33" : "transparent",
        }}
      >
        {pages.map((page) => (
          <KanbanCard
            key={page.id}
            page={page}
            onSelectPage={onSelectPage}
            onDelete={onDelete}
            onStar={onStar}
            onDragStart={onDragStart}
          />
        ))}

        {pages.length === 0 && !isOver && (
          <button
            onClick={() => onAddPage(column.id)}
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed p-6 transition-all duration-150 text-xs"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            <Plus size={12} />
            Add a page
          </button>
        )}
      </div>
    </div>
  );
}

export default function KanbanBoard({ pages, setPages, onSelectPage, workspaceId, onDelete: onDeleteProp, onStar: onStarProp }) {
  const [draggedPage, setDraggedPage] = useState(null);

  const handleDragStart = (e, page) => {
    setDraggedPage(page);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("pageId", String(page.id));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e, targetColumnId) => {
    e.preventDefault();
    if (!draggedPage) return;
    const currentStatus = draggedPage.status || "todo";
    if (currentStatus === targetColumnId) { setDraggedPage(null); return; }

    setPages((prev) => prev.map((p) => p.id === draggedPage.id ? { ...p, status: targetColumnId } : p));
    try {
      await api.put(`/pages/status/${draggedPage.id}`, { status: targetColumnId });
    } catch (err) {
      console.error(err);
      setPages((prev) => prev.map((p) => p.id === draggedPage.id ? { ...p, status: currentStatus } : p));
    }
    setDraggedPage(null);
  };

  const handleAddPage = async (status) => {
    try {
      const res = await api.post("/pages", { title: "Untitled", content: "", workspace_id: workspaceId, status });
      const newPage = { ...res.data, status };
      setPages((prev) => [...prev, newPage]);
      onSelectPage(newPage);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/pages/${id}`);
      setPages((prev) => prev.filter((p) => p.id !== id));
      if (onDeleteProp) onDeleteProp();
    } catch (err) { console.error(err); }
  };

  const handleStar = async (id) => {
    try {
      const res = await api.put(`/pages/star/${id}`);
      setPages((prev) => prev.map((p) => p.id === id ? { ...p, is_starred: res.data.is_starred } : p));
      if (onStarProp) onStarProp();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="flex-1 overflow-x-auto overflow-y-auto" style={{ background: "var(--bg-base)" }}>
      <div className="flex gap-5 p-8 min-h-full items-start">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            pages={pages.filter((p) => (p.status || "todo") === column.id)}
            onSelectPage={onSelectPage}
            onDelete={handleDelete}
            onStar={handleStar}
            onAddPage={handleAddPage}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          />
        ))}
      </div>
    </div>
  );
}