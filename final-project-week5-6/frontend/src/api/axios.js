import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

API.interceptors.request.use((r) => {
  const t = localStorage.getItem("token");
  if (t) r.headers.Authorization = `Bearer ${t}`;
  return r;
});

export default API;
