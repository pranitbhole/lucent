import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import api from "../lib/api";

function PasswordStrength({ password }) {
  const checks = [
    { label: "8+ characters", pass: password.length >= 8 },
    { label: "Uppercase", pass: /[A-Z]/.test(password) },
    { label: "Number", pass: /[0-9]/.test(password) },
  ];
  if (!password) return null;
  const score = checks.filter(c => c.pass).length;
  const colors = ["var(--accent-red)", "var(--accent-yellow)", "var(--accent-green)"];
  return (
    <div className="mt-2 space-y-1.5">
      {/* Strength bar */}
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="h-0.5 flex-1 rounded-full transition-all duration-300"
            style={{ background: i < score ? colors[score - 1] : "var(--border)" }}
          />
        ))}
      </div>
      {/* Checks */}
      <div className="flex items-center gap-3">
        {checks.map((check) => (
          <div key={check.label} className="flex items-center gap-1">
            <div
              className="w-1.5 h-1.5 rounded-full transition-colors duration-200"
              style={{ background: check.pass ? "var(--accent-green)" : "var(--text-muted)" }}
            />
            <span
              className="text-xs transition-colors duration-200"
              style={{ color: check.pass ? "var(--accent-green)" : "var(--text-muted)" }}
            >
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  if (password.length < 8) {
    setError("Password must be at least 8 characters.");
    return;
  }
  setLoading(true);
  try {
    const res = await api.post("/auth/register", { email, password });
    login(res.data.user);
    window.location.href = '/dashboard'; // ← force hard redirect
  } catch (err) {
    setError(err.response?.data?.message || "Registration failed.");
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.04)_0%,_transparent_60%)]" />

      <div className="relative w-full max-w-sm fade-up">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
        </div>

        <h1 className="text-xl font-semibold text-white text-center mb-1 tracking-tight">
          Create account
        </h1>
        <p className="text-sm text-center mb-8" style={{ color: "var(--text-secondary)" }}>
          Start writing in your workspace
        </p>

        <div className="rounded-2xl border p-6" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-[#444] outline-none transition-all duration-150 border"
                style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
                onFocus={e => e.target.style.borderColor = "var(--border-hover)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className="w-full px-3 py-2.5 pr-10 rounded-lg text-sm text-white placeholder-[#444] outline-none transition-all duration-150 border"
                  style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
                  onFocus={e => e.target.style.borderColor = "var(--border-hover)"}
                  onBlur={e => e.target.style.borderColor = "var(--border)"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "var(--text-muted)" }}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            {error && (
              <div
                className="rounded-lg px-3 py-2 text-xs border"
                style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.15)", color: "#f87171" }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || password.length < 8}
              className="w-full py-2.5 rounded-lg text-sm font-medium text-black bg-white transition-all duration-150 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed mt-1"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link to="/login" className="text-white/60 hover:text-white transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}