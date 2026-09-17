const fs = require("fs");
const cloudinary = require("../config/cloudinary");

const isCloudinaryConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );

const uploadFile = async (file, folder = "projecthub") => {
  if (!file) return null;

  if (!isCloudinaryConfigured()) {
    return { url: `/uploads/${file.filename}` };
  }

  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder,
      resource_type: "image",
    });

    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    return { url: result.secure_url };
  } catch (error) {
    console.error(`[CLOUDINARY ERROR] ${error.message}`);
    return { url: `/uploads/${file.filename}` };
  }
};

module.exports = uploadFile;
module.exports.isCloudinaryConfigured = isCloudinaryConfigured;
