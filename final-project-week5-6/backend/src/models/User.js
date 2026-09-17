const m = require("mongoose");
module.exports = m.model(
  "User",
  new m.Schema(
    {
      name: String,
      email: { type: String, unique: true },
      password: String,
      role: { type: String, default: "user" },
      avatar: { url: String },
      isPremium: { type: Boolean, default: false },
    },
    { timestamps: true },
  ),
);
