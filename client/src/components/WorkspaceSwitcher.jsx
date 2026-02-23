import { useState } from "react";
import { Check, Plus, Pencil, Trash2, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "../lib/api";

export default function WorkspaceSwitcher({ workspaces, activeWorkspace, onSwitch, onWorkspacesChange }) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const createWorkspace = async () => {
    if (!newName.trim()) return;
    try {
      const res = await api.post("/workspaces", { name: newName.trim(), icon: "🗂️" });
      onWorkspacesChange([...workspaces, res.data]);
      onSwitch(res.data);
      setNewName("");
      setCreating(false);
      setOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const updateWorkspace = async (id) => {
    if (!editName.trim()) return;
    try {
      const res = await api.put(`/workspaces/${id}`, { name: editName.trim(), icon: "🗂️" });
      onWorkspacesChange(workspaces.map((w) => (w.id === id ? res.data : w)));
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteWorkspace = async (e, id) => {
    e.stopPropagation();
    if (workspaces.length === 1) return alert("You need at least one workspace.");
    try {
      await api.delete(`/workspaces/${id}`);
      const updated = workspaces.filter((w) => w.id !== id);
      onWorkspacesChange(updated);
      if (activeWorkspace?.id === id) onSwitch(updated[0]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors group"
      >
        <div className="flex items-center gap-2 truncate">
          <span className="text-lg">{activeWorkspace?.icon || "🗂️"}</span>
          <span className="text-white text-sm font-medium truncate">
            {activeWorkspace?.name || "Select Workspace"}
          </span>
        </div>
        <ChevronDown size={14} className="text-gray-400 shrink-0" />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-12 left-0 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="p-2 border-b border-gray-700">
              <p className="text-gray-500 text-xs uppercase tracking-wider px-2 py-1">Workspaces</p>
            </div>

            <div className="max-h-48 overflow-y-auto">
              {workspaces.map((workspace) => (
                <div
                  key={workspace.id}
                  onClick={() => {
                    onSwitch(workspace);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between px-3 py-2 hover:bg-gray-700 cursor-pointer group/item"
                >
                  {editingId === workspace.id ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") updateWorkspace(workspace.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-gray-600 text-white text-sm px-2 py-0.5 rounded outline-none flex-1 mr-2"
                    />
                  ) : (
                    <div className="flex items-center gap-2 truncate flex-1">
                      <span>{workspace.icon}</span>
                      <span className="text-white text-sm truncate">{workspace.name}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    {activeWorkspace?.id === workspace.id && !editingId && (
                      <Check size={13} className="text-green-400" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(workspace.id);
                        setEditName(workspace.name);
                      }}
                      className="opacity-0 group-hover/item:opacity-100 text-gray-500 hover:text-white p-0.5"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={(e) => deleteWorkspace(e, workspace.id)}
                      className="opacity-0 group-hover/item:opacity-100 text-gray-500 hover:text-red-400 p-0.5"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Create new workspace */}
            <div className="p-2 border-t border-gray-700">
              {creating ? (
                <div className="flex gap-2">
                  <Input
                    autoFocus
                    placeholder="Workspace name..."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") createWorkspace();
                      if (e.key === "Escape") setCreating(false);
                    }}
                    className="bg-gray-700 border-gray-600 text-white text-sm h-8"
                  />
                  <Button size="sm" onClick={createWorkspace} className="h-8">
                    Add
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setCreating(true)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-gray-400 hover:text-white text-sm rounded hover:bg-gray-700 transition-colors"
                >
                  <Plus size={14} />
                  New Workspace
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}