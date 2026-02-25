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
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      {/* Header */}
      <div className="border-b px-6 py-3 flex items-center gap-3" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 text-xs transition-colors px-2 py-1.5 rounded-lg hover:bg-white/5"
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeft size={13} />
          Back
        </button>
        <div className="w-px h-4" style={{ background: "var(--border)" }} />
        <div className="flex items-center gap-2">
          <Trash2 size={13} style={{ color: "var(--text-muted)" }} />
          <span className="text-sm font-medium text-white">Trash</span>
        </div>
        {trashedPages.length > 0 && (
          <span className="text-xs px-1.5 py-0.5 rounded-md ml-1" style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }}>
            {trashedPages.length}
          </span>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "var(--border)", borderTopColor: "var(--text-secondary)" }} />
          </div>
        ) : trashedPages.length === 0 ? (
          <div className="text-center py-24 fade-up">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center border" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
              <Trash2 size={20} style={{ color: "var(--text-muted)" }} />
            </div>
            <p className="text-sm font-medium text-white mb-1">Trash is empty</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Deleted pages will appear here</p>
          </div>
        ) : (
          <div className="space-y-1.5 fade-up">
            {trashedPages.map((page) => (
              <div
                key={page.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl border group transition-all duration-150"
                style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border-hover)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center border shrink-0" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
                    <FileText size={12} style={{ color: "var(--text-muted)" }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{page.title || "Untitled"}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      Deleted {new Date(page.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => restorePage(page.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                    style={{ color: "var(--accent-green)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(34,197,94,0.08)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <RotateCcw size={11} />
                    Restore
                  </button>
                  <button
                    onClick={() => permanentDelete(page.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                    style={{ color: "var(--accent-red)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <Trash2 size={11} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}