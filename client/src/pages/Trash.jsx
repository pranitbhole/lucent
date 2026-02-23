import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { ArrowLeft, RotateCcw, Trash2, FileText } from "lucide-react";

export default function Trash() {
  const [trashedPages, setTrashedPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { fetchTrash(); }, []);

  const fetchTrash = async () => {
    try {
      const workspacesRes = await api.get("/workspaces");
      const allTrashed = await Promise.all(
        workspacesRes.data.map((w) =>
          api.get(`/pages/trash/all?workspace_id=${w.id}`).then((res) => res.data)
        )
      );
      setTrashedPages(allTrashed.flat());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const restorePage = async (id) => {
    try {
      await api.put(`/pages/trash/restore/${id}`);
      setTrashedPages((prev) => prev.filter((p) => p.id !== id));
    } catch (err) { console.error(err); }
  };

  const permanentDelete = async (id) => {
    if (!confirm("Permanently delete this page? This cannot be undone.")) return;
    try {
      await api.delete(`/pages/trash/permanent/${id}`);
      setTrashedPages((prev) => prev.filter((p) => p.id !== id));
    } catch (err) { console.error(err); }
  };

  return (
    <div className="min-h-screen bg-[#191919] text-white">
      {/* Header */}
      <div className="border-b border-white/5 px-8 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-gray-500 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft size={15} />
          Back
        </button>
        <div className="w-px h-4 bg-gray-800" />
        <div className="flex items-center gap-2">
          <Trash2 size={15} className="text-gray-500" />
          <h1 className="text-sm font-medium text-gray-300">Trash</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-8 py-12">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-gray-700 border-t-gray-400 rounded-full animate-spin mx-auto" />
          </div>
        ) : trashedPages.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-gray-600" />
            </div>
            <p className="text-gray-400 font-medium">Trash is empty</p>
            <p className="text-gray-600 text-sm mt-1">Deleted pages will appear here</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-gray-400 text-sm">
                {trashedPages.length} deleted page{trashedPages.length > 1 ? "s" : ""}
              </h2>
            </div>
            <div className="space-y-2">
              {trashedPages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center justify-between bg-white/3 hover:bg-white/5 border border-white/5 rounded-xl px-4 py-3 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      <FileText size={14} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">
                        {page.title || "Untitled"}
                      </p>
                      <p className="text-gray-600 text-xs mt-0.5">
                        Deleted {new Date(page.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => restorePage(page.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-green-400 hover:bg-green-400/10 transition-colors"
                    >
                      <RotateCcw size={12} />
                      Restore
                    </button>
                    <button
                      onClick={() => permanentDelete(page.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}