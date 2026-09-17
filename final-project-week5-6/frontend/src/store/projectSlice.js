import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../api/axios";

export const fetchProjects = createAsyncThunk(
  "projects/fetch",
  async (params, { rejectWithValue }) => {
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
      // Fetch
      .addCase(fetchProjects.pending, (state) => { state.loading = true; })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data;
        state.count = action.payload.count;
      })
      .addCase(fetchProjects.rejected, (state) => { state.loading = false; })
      // Create
      .addCase(createProject.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
        state.count += 1;
      })
      // Delete
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.list = state.list.filter((p) => p._id !== action.payload.id);
        state.count = Math.max(0, state.count - 1);
      });
  },
});

export default projectSlice.reducer;
