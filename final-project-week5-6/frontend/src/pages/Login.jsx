import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, clearError } from "../store/authSlice";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { LogIn, Mail, Lock, Zap } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const nav = useNavigate();
  const { loading } = useSelector((s) => s.auth);

  const submit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    const r = await dispatch(loginUser({ email, password }));
    if (r.payload?.success) {
      toast.success(`Welcome back! 👋`);
      nav("/dashboard");
    } else {
      toast.error(r.payload?.message || "Login failed. Please try again.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel animate-fade-in">
        {/* Header */}
        <div className="auth-header">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "linear-gradient(135deg, #3b82f6, #10b981)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Zap size={28} color="white" />
            </div>
          </div>
          <h2 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Welcome Back</h2>
          <p style={{ marginBottom: 0 }}>Sign in to your ProjectHub account</p>
        </div>

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: "relative" }}>
              <Mail size={16} style={{
                position: "absolute", left: "1rem", top: "50%",
                transform: "translateY(-50%)", color: "var(--text-muted)"
              }} />
              <input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
                style={{ paddingLeft: "2.75rem" }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={16} style={{
                position: "absolute", left: "1rem", top: "50%",
                transform: "translateY(-50%)", color: "var(--text-muted)"
              }} />
              <input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field"
                style={{ paddingLeft: "2.75rem" }}
              />
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
            style={{ marginTop: "0.5rem" }}
          >
            {loading ? (
              <>
                <span style={{ width: 16, height: 16, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                Signing in...
              </>
            ) : (
              <><LogIn size={16} /> Sign In</>
            )}
          </button>
        </form>

        <p className="text-center mt-4" style={{ marginBottom: 0 }}>
          Don&apos;t have an account?{" "}
          <Link to="/register" id="go-register" style={{ fontWeight: 600 }}>Create one →</Link>
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
