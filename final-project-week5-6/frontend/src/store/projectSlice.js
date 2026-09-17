import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../api/axios";

const DEMO_MODE = String(import.meta.env.VITE_DEMO_MODE || "false").toLowerCase() === "true";
const DEMO_PROJECTS_KEY = "projecthub-demo-projects";

const getDemoProjects = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(DEMO_PROJECTS_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
};

const saveDemoProjects = (projects) => {
  localStorage.setItem(DEMO_PROJECTS_KEY, JSON.stringify(projects));
};

export const fetchProjects = createAsyncThunk(
  "projects/fetch",
  async (params, { rejectWithValue }) => {
    if (DEMO_MODE) {
      const projects = getDemoProjects().filter((project) => {
        if (!params?.search) return true;
        return project.title.toLowerCase().includes(String(params.search).toLowerCase());
      });

      return { success: true, count: projects.length, data: projects };
    }

    try {
      const { data } = await API.get("/projects", { params });
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: "Failed to fetch" });
    }
  }
);

export const createProject = createAsyncThunk(
  "projects/create",
  async (fd, { rejectWithValue }) => {
    if (DEMO_MODE) {
      const form = Object.fromEntries(fd.entries());
      const project = {
        _id: `demo-project-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        title: String(form.title || "Untitled Project"),
        description: String(form.description || ""),
        status: String(form.status || "pending"),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        image: form.image ? { url: URL.createObjectURL(form.image) } : null,
      };

      const projects = getDemoProjects();
      projects.unshift(project);
      saveDemoProjects(projects);
      return project;
    }

    try {
      const { data } = await API.post("/projects", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data.data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: "Failed to create" });
    }
  }
);

export const deleteProject = createAsyncThunk(
  "projects/delete",
  async (id, { rejectWithValue }) => {
    if (DEMO_MODE) {
      const projects = getDemoProjects().filter((project) => project._id !== id);
      saveDemoProjects(projects);
      return { success: true, id };
    }

    try {
      const { data } = await API.delete(`/projects/${id}`);
      return { ...data, id };
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: "Failed to delete" });
    }
  }
);

const projectSlice = createSlice({
  name: "projects",
  initialState: { list: [], count: 0, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => { state.loading = true; })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data || [];
        state.count = action.payload.count || state.list.length;
      })
      .addCase(fetchProjects.rejected, (state) => { state.loading = false; })
      .addCase(createProject.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
        state.count += 1;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.list = state.list.filter((p) => p._id !== action.payload.id);
        state.count = Math.max(0, state.count - 1);
      });
  },
});

export default projectSlice.reducer;
