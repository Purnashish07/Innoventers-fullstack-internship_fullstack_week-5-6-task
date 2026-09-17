const m = require("mongoose");
module.exports = m.model(
  "Project",
  new m.Schema(
    {
      title: String,
      description: String,
      status: { type: String, default: "pending" },
      image: { url: String },
      owner: { type: m.Schema.Types.ObjectId, ref: "User" },
      isPaid: { type: Boolean, default: false },
    },
    { timestamps: true },
  ),
);
