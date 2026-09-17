const e = require("express");
const r = e.Router();
const { register, login, getMe } = require("../controllers/auth.controller");
const { protect } = require("../middlewares/auth.middleware");
const { upload } = require("../middlewares/upload.middleware");
r.post("/register", upload.single("avatar"), register);
r.post("/login", login);
r.get("/me", protect, getMe);
module.exports = r;
