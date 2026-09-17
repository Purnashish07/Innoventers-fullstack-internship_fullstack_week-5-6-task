const mongoose = require("mongoose");

module.exports = async () => {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/projecthub";

  try {
    const connection = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[DB] MongoDB connected: ${connection.connection.host}`);
  } catch (err) {
    console.error(`[DB WARNING] MongoDB not reachable at ${mongoUri}. ${err.message}`);
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
};

