import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { registerUser, clearError } from "../store/authSlice";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { UserPlus, Mail, Lock, User, Image, Zap } from "lucide-react";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const dispatch = useDispatch();
  const nav = useNavigate();
  const { loading } = useSelector((s) => s.auth);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    setAvatar(file);
    if (file) setAvatarPreview(URL.createObjectURL(file));
  };

  const submit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (avatar) fd.append("avatar", avatar);
    const r = await dispatch(registerUser(fd));
    if (r.payload?.success) {
      toast.success("Account created! Welcome 🎉");
      nav("/dashboard");
    } else {
      toast.error(r.payload?.message || "Registration failed.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel animate-fade-in">
        <div className="auth-header">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "linear-gradient(135deg, #10b981, #3b82f6)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Zap size={28} color="white" />
            </div>
          </div>
          <h2 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Create Account</h2>
          <p style={{ marginBottom: 0 }}>Join ProjectHub today</p>
        </div>

        {/* Avatar Preview */}
        {avatarPreview && (
          <div className="text-center" style={{ marginBottom: "1rem" }}>
            <img
              src={avatarPreview}
              alt="avatar preview"
              style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--primary-color)" }}
            />
          </div>
        )}

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: "relative" }}>
              <User size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                id="reg-name"
                type="text"
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="input-field"
                style={{ paddingLeft: "2.75rem" }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: "relative" }}>
              <Mail size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                id="reg-email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="input-field"
                style={{ paddingLeft: "2.75rem" }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                id="reg-password"
                type="password"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
                className="input-field"
                style={{ paddingLeft: "2.75rem" }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Image size={14} style={{ display: "inline", marginRight: "0.4rem" }} />
              Profile Photo <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>(optional)</span>
            </label>
            <input
              id="reg-avatar"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}
            />
          </div>

          <button
            id="reg-submit"
            type="submit"
            disabled={loading}
            className="btn btn-secondary w-full"
            style={{ marginTop: "0.5rem" }}
          >
            {loading ? (
              <>
                <span style={{ width: 16, height: 16, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                Creating account...
              </>
            ) : (
              <><UserPlus size={16} /> Create Account</>
            )}
          </button>
        </form>

        <p className="text-center mt-4" style={{ marginBottom: 0 }}>
          Already have an account?{" "}
          <Link to="/login" id="go-login" style={{ fontWeight: 600 }}>Sign in →</Link>
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
