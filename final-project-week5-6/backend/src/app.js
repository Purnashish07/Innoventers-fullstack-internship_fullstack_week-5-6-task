require("dotenv").config();
const express = require("express");
const cors = require("cors");
const security = require("./middlewares/security.middleware");
const errorHandler = require("./middlewares/error.middleware");
const path = require("path");

const app = express();
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [frontendUrl, "http://localhost:5173", "http://127.0.0.1:5173"];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use(security);

app.get("/", (req, res) =>
  res.json({
    success: true,
    message: "ProjectHub API is running",
    version: "week5-6",
    features: ["upload", "payment", "email", "cache", "security"],
  }),
);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/projects", require("./routes/project.routes"));
app.use(errorHandler);
module.exports = app;
