const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const sendEmail = require("../utils/sendEmail");
const { buildWelcomeEmail } = require("../utils/sendEmail");
const uploadFile = require("../utils/cloudinaryUpload");
const ApiError = require("../utils/ApiError");

const genToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    throw new ApiError(400, "Please provide all required fields");
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  if (await User.findOne({ email: normalizedEmail })) {
    throw new ApiError(400, "User already exists");
  }

  const hash = await bcrypt.hash(password, 10);
  const uploadedAvatar = req.file ? await uploadFile(req.file, "projecthub/avatars") : null;
  const user = await User.create({
    name,
    email: normalizedEmail,
    password: hash,
    avatar: uploadedAvatar || {},
  });
  await sendEmail({
    to: user.email,
    subject: "Welcome to ProjectHub",
    html: buildWelcomeEmail(user.name),
  });

  const token = genToken(user._id, user.role);
  res.status(201).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isPremium: user.isPremium,
      avatar: user.avatar,
    },
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, "Please provide email and password");
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = genToken(user._id, user.role);
  res.json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isPremium: user.isPremium,
      avatar: user.avatar,
    },
  });
});

exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) throw new ApiError(404, "User not found");
  res.json({ success: true, user });
});
