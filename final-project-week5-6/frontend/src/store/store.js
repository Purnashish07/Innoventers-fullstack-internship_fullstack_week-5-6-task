import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import projectReducer from "./projectSlice";
export default configureStore({
  reducer: { auth: authReducer, projects: projectReducer },
});
