import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../api/axios";

const DEMO_MODE = String(import.meta.env.VITE_DEMO_MODE || "false").toLowerCase() === "true";
const DEMO_USERS_KEY = "projecthub-demo-users";

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const getDemoUsers = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(DEMO_USERS_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
};

const saveDemoUsers = (users) => {
  localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users));
};

const buildDemoUser = ({ name, email, password, avatar = null, isPremium = false }) => ({
  _id: `demo-user-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
  name,
  email,
  password,
  avatar,
  isPremium,
  role: "user",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const registerUser = createAsyncThunk(
  "auth/register",
  async (fd, { rejectWithValue }) => {
    if (DEMO_MODE) {
      try {
        const form = Object.fromEntries(fd.entries());
        const users = getDemoUsers();
        const existing = users.find((u) => u.email.toLowerCase() === String(form.email || "").toLowerCase());

        if (existing) {
          return rejectWithValue({ message: "An account with this email already exists." });
        }

        const user = buildDemoUser({
          name: String(form.name || "Demo User"),
          email: String(form.email || ""),
          password: String(form.password || ""),
          avatar: form.avatar ? { url: URL.createObjectURL(form.avatar) } : null,
        });

        users.push(user);
        saveDemoUsers(users);

        const token = `demo-token-${Date.now()}`;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        return { success: true, token, user };
      } catch (error) {
        return rejectWithValue({ message: "Registration failed" });
      }
    }

    try {
      const { data } = await API.post("/auth/register", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: "Registration failed" });
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (f, { rejectWithValue }) => {
    if (DEMO_MODE) {
      try {
        const users = getDemoUsers();
        const email = String(f.email || "").toLowerCase();
        const password = String(f.password || "");
        const user = users.find((entry) => entry.email.toLowerCase() === email && entry.password === password);

        if (!user) {
          return rejectWithValue({ message: "Invalid email or password." });
        }

        const token = `demo-token-${Date.now()}`;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        return { success: true, token, user };
      } catch (error) {
        return rejectWithValue({ message: "Login failed" });
      }
    }

    try {
      const { data } = await API.post("/auth/login", f);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data || { message: "Login failed" });
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: getStoredUser(),
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.error = null;
      localStorage.clear();
    },
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      localStorage.setItem("user", JSON.stringify(action.payload));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user || action.payload.data?.user || null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      })
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user || action.payload.data?.user || null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      });
  },
});

export const { logout, clearError, setUser } = authSlice.actions;
export default authSlice.reducer;
