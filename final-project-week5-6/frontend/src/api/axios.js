import axios from "axios";

const isDemoMode = String(import.meta.env.VITE_DEMO_MODE || "false").toLowerCase() === "true";
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000/api" : "/api");

const API = axios.create({
  baseURL: isDemoMode ? "/" : API_URL,
  withCredentials: true,
});

API.interceptors.request.use((r) => {
  const t = localStorage.getItem("token");
  if (t) r.headers.Authorization = `Bearer ${t}`;
  return r;
});

export default API;
