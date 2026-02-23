import { useState, useEffect } from "react";
import { Plus, FileText, Star, Trash2 } from "lucide-react";
import api from "../lib/api";

const COLUMNS = [
  { id: "todo", label: "To Do", color: "#6b7280", dot: "bg-gray-500" },
  { id: "in_progress", label: "In Progress", color: "#3b82f6", dot: "bg-blue-500" },
  { id: "done", label: "Done", color: "#22c55e", dot: "bg-green-500" },
];

function KanbanCard({ page, onSelectPage, onDelete, onStar, onDragStart }) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, page)}
      onClick={() => onSelectPage(page)}
      className="bg-[#2a2a2a] border border-white/5 rounded-lg p-3 group hover:border-white/10 transition-all cursor-pointer select-none"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">
            {page.title || "Untitled"}
          </p>
          {page.content && (
            <p className="text-gray-600 text-xs mt-1 line-clamp-2">
              {page.content.replace(/<[^>]+>/g, "").trim().slice(0, 100)}
              {page.content.replace(/<[^>]+>/g, "").trim().length > 100 ? "..." : ""}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onStar(page.id); }}
            className={`p-0.5 rounded ${page.is_starred ? "text-yellow-400" : "text-gray-600 hover:text-gray-400"}`}
          >
            <Star size={11} fill="none" strokeWidth={2} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(e, page.id); }}
            className="p-0.5 rounded text-gray-600 hover:text-red-400"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 mt-2.5 text-gray-600 text-xs">
        <FileText size={10} />
        <span>
          {new Date(page.updated_at).toLocaleDateString("en-US", {
            month: "short", day: "numeric",
          })}
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
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${column.dot}`} />
          <span className="text-gray-300 text-sm font-medium">{column.label}</span>
          <span className="text-gray-600 text-xs bg-white/5 rounded px-1.5 py-0.5">
            {pages.length}
          </span>
        </div>
        <button
          onClick={() => onAddPage(column.id)}
          className="text-gray-600 hover:text-white p-1 rounded hover:bg-white/5 transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsOver(true); onDragOver(e); }}
        onDragLeave={() => setIsOver(false)}
        onDrop={(e) => { setIsOver(false); onDrop(e, column.id); }}
        className={`flex flex-col gap-2 flex-1 min-h-[200px] rounded-xl p-2 transition-colors ${
          isOver ? "bg-white/5 border border-dashed border-white/10" : "border border-transparent"
        }`}
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
          <div
            onClick={() => onAddPage(column.id)}
            className="border border-dashed border-white/5 rounded-lg p-6 text-center cursor-pointer hover:border-white/10 transition-colors group"
          >
            <p className="text-gray-700 text-xs group-hover:text-gray-500">
              + Add a page
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function KanbanBoard({ pages, setPages, onSelectPage, workspaceId ,onDelete ,onStar }) {
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
    if (currentStatus === targetColumnId) {
      setDraggedPage(null);
      return;
    }

    // Optimistically update UI immediately
    setPages((prev) =>
      prev.map((p) =>
        p.id === draggedPage.id ? { ...p, status: targetColumnId } : p
      )
    );

    // Persist to server
    try {
      await api.put(`/pages/status/${draggedPage.id}`, { status: targetColumnId });
    } catch (err) {
      console.error("Failed to update status:", err);
      // Revert on error
      setPages((prev) =>
        prev.map((p) =>
          p.id === draggedPage.id ? { ...p, status: currentStatus } : p
        )
      );
    }

    setDraggedPage(null);
  };

  const handleAddPage = async (status) => {
    try {
      const res = await api.post("/pages", {
        title: "Untitled",
        content: "",
        workspace_id: workspaceId,
        status: status,
      });
      // Add to kanban with correct status
      const newPage = { ...res.data, status: status };
      setPages((prev) => [...prev, newPage]);
      onSelectPage(newPage);
    } catch (err) {
      console.error(err);
    }
  };

const handleDelete = async (e, id) => {
  e.stopPropagation();
  try {
    await api.delete(`/pages/${id}`);
    setPages((prev) => prev.filter((p) => p.id !== id));
    if (onDelete) onDelete(); // ← triggers sidebar refresh
  } catch (err) {
    console.error(err);
  }
};

 const handleStar = async (id) => {
  try {
    const res = await api.put(`/pages/star/${id}`);
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_starred: res.data.is_starred } : p))
    );
    if (onStar) onStar(); 
  } catch (err) {
    console.error(err);
  }
};

  return (
    <div className="flex-1 overflow-x-auto overflow-y-auto bg-[#191919]">
      <div className="flex gap-6 p-8 min-h-full items-start">
        {COLUMNS.map((column) => {
          const columnPages = pages.filter(
            (p) => (p.status || "todo") === column.id
          );
          return (
            <KanbanColumn
              key={column.id}
              column={column}
              pages={columnPages}
              onSelectPage={onSelectPage}
              onDelete={handleDelete}
              onStar={handleStar}
              onAddPage={handleAddPage}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            />
          );
        })}
      </div>
    </div>
  );
}