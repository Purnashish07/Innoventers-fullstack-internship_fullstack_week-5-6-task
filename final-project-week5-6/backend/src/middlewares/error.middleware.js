module.exports = (err, req, res, next) => {
  const externalMessage = err?.error?.description || err?.error?.message || err?.message || "Server Error";
  console.error(`[ERROR] ${req.method} ${req.originalUrl} => ${externalMessage}`);

  if (err.name === "MulterError") {
    return res.status(400).json({ success: false, message: err.message });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ success: false, message: "Invalid ID format." });
  }

  if (err.code === 11000) {
    return res.status(400).json({ success: false, message: "Duplicate value found." });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Something went wrong." : externalMessage,
  });
};
