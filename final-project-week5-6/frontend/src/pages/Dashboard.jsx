import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProjects, createProject, deleteProject } from "../store/projectSlice";
import { logout } from "../store/authSlice";
import API from "../api/axios";
import toast from "react-hot-toast";
import {
  LogOut, Plus, Trash2, Search, CreditCard, Folder,
  X, CheckCircle, Clock, Zap, BarChart2, Star
} from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

function StatusBadge({ status }) {
  return (
    <span className={`badge ${status === "completed" ? "badge-completed" : "badge-pending"}`}>
      {status === "completed" ? <CheckCircle size={11} style={{ display: "inline", marginRight: 4 }} /> : <Clock size={11} style={{ display: "inline", marginRight: 4 }} />}
      {status}
    </span>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className="empty-state animate-fade-in">
      <div className="empty-icon"><Folder size={48} color="var(--text-muted)" /></div>
      <h3>No Projects Yet</h3>
      <p>Create your first project to get started.</p>
      <button className="btn btn-primary" onClick={onAdd} id="empty-add-project">
        <Plus size={16} /> New Project
      </button>
    </div>
  );
}

export default function Dashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { list, count, loading } = useSelector((s) => s.projects);

  const [form, setForm] = useState({ title: "", description: "", status: "pending" });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [demoPaymentOpen, setDemoPaymentOpen] = useState(false);
  const [demoPaymentData, setDemoPaymentData] = useState(null);
  const [demoProcessing, setDemoProcessing] = useState(false);
  const [demoSuccess, setDemoSuccess] = useState(false);
  const [cacheHit, setCacheHit] = useState(false);
  const isDemoMode = String(import.meta.env.VITE_DEMO_MODE || "false").toLowerCase() === "true" || String(import.meta.env.VITE_DEMO_PAYMENT_MODE || "false").toLowerCase() === "true";

  useEffect(() => {
    const timer = setTimeout(() => dispatch(fetchProjects({ search })), 350);
    return () => clearTimeout(timer);
  }, [search, dispatch]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Title is required");
    setSubmitting(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (image) fd.append("image", image);
    const r = await dispatch(createProject(fd));
    setSubmitting(false);
    if (r.payload) {
      toast.success("Project created! 🚀");
      setShowModal(false);
      setForm({ title: "", description: "", status: "pending" });
      setImage(null);
      setImagePreview(null);
    } else {
      toast.error("Failed to create project.");
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    const r = await dispatch(deleteProject(id));
    if (r.payload?.success) toast.success("Project deleted.");
    else toast.error("Failed to delete.");
  };

  const handlePay = async () => {
    setPayLoading(true);
    try {
      if (isDemoMode) {
        const demoData = {
          success: true,
          mode: "demo",
          provider: "demo",
          order: {
            id: `DEMO_ORDER_${Date.now()}`,
            amount: 49900,
            currency: "INR",
            receipt: `demo_premium_${user?._id || "user"}_${Date.now()}`,
          },
          paymentId: `DEMO_PAY_${Date.now()}`,
          key: null,
          message: "Demo payment ready",
        };
        setDemoPaymentData(demoData);
        setDemoPaymentOpen(true);
        setDemoSuccess(false);
        setPayLoading(false);
        return;
      }

      const endpoint = "/projects/payment/order";
      const { data } = await API.post(endpoint, { amount: 499 });

      if (!window.Razorpay) {
        toast.error("Razorpay SDK is unavailable. Please reload the page and try again.");
        setPayLoading(false);
        return;
      }

      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "ProjectHub",
        description: "Premium Plan",
        order_id: data.order.id,
        handler: async (response) => {
          try {
            const verifyResponse = await API.post("/projects/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyResponse.data?.success) {
              toast.success("🎉 Payment successful! Premium activated.");
              const updatedUser = { ...user, isPremium: true };
              localStorage.setItem("user", JSON.stringify(updatedUser));
              dispatch({ type: "auth/setUser", payload: updatedUser });
            } else {
              toast.error(verifyResponse.data?.message || "Payment could not be verified.");
            }
          } catch (error) {
            toast.error(error.response?.data?.message || "Payment verification failed.");
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        theme: { color: "#3b82f6" },
        modal: {
          ondismiss: () => {
            toast("Payment cancelled.", { icon: "ℹ️" });
          },
        },
      };

      new window.Razorpay(options).open();
    } catch (error) {
      toast.error(error.response?.data?.message || "Payment order creation failed.");
    } finally {
      setPayLoading(false);
    }
  };

  const completeDemoPayment = async () => {
    if (!demoPaymentData) return;
    setDemoProcessing(true);
    try {
      const updatedUser = { ...user, isPremium: true };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      dispatch({ type: "auth/setUser", payload: updatedUser });
      setDemoSuccess(true);
      toast.success("Payment Successful — ₹499 Demo Payment Completed");
    } catch (error) {
      toast.error("Demo payment verification failed.");
    } finally {
      setDemoProcessing(false);
    }
  };

  const avatarInitial = user?.name?.[0]?.toUpperCase() || "U";
  const completedCount = list.filter((p) => p.status === "completed").length;
  const isPremium = Boolean(user?.isPremium);

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="user-avatar">{avatarInitial}</div>
          <div style={{ overflow: "hidden" }}>
            <p style={{ fontWeight: 600, marginBottom: 0, color: "var(--text-color)", fontSize: "0.95rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user?.name}
            </p>
            <p style={{ fontSize: "0.75rem", marginBottom: 0, color: "var(--text-muted)" }}>
              {user?.role || "user"}
              {isPremium ? " • Premium" : ""}
            </p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-item active">
            <Folder size={18} /> Projects
          </div>
          <div className="nav-item" style={{ cursor: "default" }}>
            <BarChart2 size={18} /> Analytics
          </div>
        </nav>

        {/* Stats */}
        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border-color)" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Overview</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Total</span>
              <span style={{ fontWeight: 700, color: "var(--text-color)" }}>{count}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Done</span>
              <span style={{ fontWeight: 700, color: "var(--secondary-color)" }}>{completedCount}</span>
            </div>
          </div>
        </div>

        {/* Premium CTA */}
        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border-color)" }}>
          <div style={{
            background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(16,185,129,0.2))",
            border: "1px solid rgba(59,130,246,0.3)",
            borderRadius: "var(--radius-md)",
            padding: "1rem",
            textAlign: "center"
          }}>
            <Star size={20} color="#fbbf24" style={{ marginBottom: "0.5rem" }} />
            <p style={{ fontSize: "0.8rem", marginBottom: "0.75rem", color: "var(--text-color)" }}>Upgrade to Premium</p>
            <button
              id="sidebar-pay-btn"
              className="btn btn-primary"
              style={{ width: "100%", padding: "0.5rem", fontSize: "0.85rem" }}
              onClick={handlePay}
              disabled={payLoading || isPremium}
            >
              <CreditCard size={14} />
              {payLoading ? "Loading..." : isPremium ? "Premium Active" : "Pay ₹499"}
            </button>
          </div>
        </div>

        {/* Logout */}
        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border-color)" }}>
          <button
            id="logout-btn"
            className="btn btn-outline w-full"
            onClick={() => { dispatch(logout()); toast("Logged out."); }}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        <div className="page-header">
          <div>
            <h2 style={{ marginBottom: "0.25rem" }}>
              <Zap size={22} color="#3b82f6" style={{ display: "inline", marginRight: 8 }} />
              My Projects
            </h2>
            <p style={{ marginBottom: 0 }}>{count} project{count !== 1 ? "s" : ""} total</p>
          </div>
          <button id="open-modal-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> New Project
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ position: "relative", marginBottom: "1.5rem" }}>
          <Search size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            id="search-projects"
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: "2.75rem" }}
          />
        </div>

        {/* Project Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <div style={{ width: 40, height: 40, border: "3px solid var(--border-color)", borderTopColor: "var(--primary-color)", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
            <p style={{ marginTop: "1rem" }}>Loading projects...</p>
          </div>
        ) : list.length === 0 ? (
          <EmptyState onAdd={() => setShowModal(true)} />
        ) : (
          <div className="grid-cards animate-fade-in">
            {list.map((p) => (
              <div key={p._id} className="card">
                {p.image?.url ? (
                  <img
                    src={p.image.url.startsWith("http") ? p.image.url : `${API_BASE}${p.image.url}`}
                    alt={p.title}
                    className="card-image"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.parentElement.appendChild(Object.assign(document.createElement("div"), {
                        style: "height: 120px; background: linear-gradient(135deg, #1e293b, #334155); display: flex; align-items: center; justify-content: center; border-bottom: 1px solid var(--border-color);",
                        innerHTML: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5v9A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9Z"/><path d="m7 15 3-3 2.5 2.5 3.5-4 4 4.5"/><circle cx="9" cy="9" r="1.5"/></svg>'
                      }));
                    }}
                  />
                ) : (
                  <div style={{ height: 120, background: "linear-gradient(135deg, #1e293b, #334155)", display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid var(--border-color)" }}>
                    <Folder size={32} color="var(--text-muted)" />
                  </div>
                )}
                <div className="card-body">
                  <div className="flex justify-between items-center" style={{ marginBottom: "0.5rem" }}>
                    <h3 style={{ fontSize: "1rem", margin: 0 }}>{p.title}</h3>
                    <StatusBadge status={p.status} />
                  </div>
                  <p style={{ fontSize: "0.85rem", marginBottom: "1rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {p.description || "No description."}
                  </p>
                  <div className="flex justify-between items-center">
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      id={`delete-${p._id}`}
                      className="btn btn-danger"
                      style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                      onClick={() => handleDelete(p._id, p.title)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* New Project Modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(4px)", display: "flex",
          alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: "1rem"
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: "100%", maxWidth: 500 }}>
            <div className="flex justify-between items-center" style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ margin: 0 }}>Create New Project</h3>
              <button
                id="close-modal-btn"
                className="btn btn-outline"
                style={{ padding: "0.4rem" }}
                onClick={() => setShowModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">Project Title *</label>
                <input
                  id="project-title"
                  type="text"
                  placeholder="e.g. E-commerce Website"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  id="project-desc"
                  placeholder="What is this project about?"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-field"
                  rows={3}
                  style={{ resize: "vertical" }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  id="project-status"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="input-field"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Project Image <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>(optional)</span></label>
                <input
                  id="project-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}
                />
                {imagePreview && (
                  <img src={imagePreview} alt="preview" style={{ marginTop: "0.75rem", width: "100%", maxHeight: 150, objectFit: "cover", borderRadius: "var(--radius-md)" }} />
                )}
              </div>

              <div className="flex gap-2">
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button id="create-project-btn" type="submit" disabled={submitting} className="btn btn-primary" style={{ flex: 1 }}>
                  {submitting ? "Creating..." : <><Plus size={16} /> Create</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {demoPaymentOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "1rem" }}>
          <div className="glass-panel animate-fade-in" style={{ width: "100%", maxWidth: 420, padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0 }}>Demo Payment</h3>
              <button className="btn btn-outline" style={{ padding: "0.35rem 0.6rem" }} onClick={() => { setDemoPaymentOpen(false); setDemoSuccess(false); setDemoPaymentData(null); }}>
                <X size={16} />
              </button>
            </div>

            {demoSuccess ? (
              <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✅</div>
                <h4 style={{ marginBottom: "0.5rem" }}>Payment Successful</h4>
                <p style={{ margin: 0, color: "var(--text-muted)" }}>₹499 Demo Payment Completed</p>
                <p style={{ marginTop: "0.75rem", color: "var(--text-muted)" }}>Payment ID: {demoPaymentData?.paymentId}</p>
                <button className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }} onClick={() => { setDemoPaymentOpen(false); setDemoSuccess(false); setDemoPaymentData(null); }}>
                  Close
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gap: "0.5rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-muted)" }}>Amount</span><strong>₹499</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-muted)" }}>Payment Method</span><strong>Demo Payment</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-muted)" }}>Status</span><strong>Ready to Pay</strong></div>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                  onClick={completeDemoPayment}
                  disabled={demoProcessing}
                >
                  {demoProcessing ? "Processing..." : "Complete Demo Payment"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
