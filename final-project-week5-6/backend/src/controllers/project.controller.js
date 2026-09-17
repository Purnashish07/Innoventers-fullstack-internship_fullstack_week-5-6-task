const crypto = require("crypto");
const Razorpay = require("razorpay");
const Project = require("../models/Project");
const User = require("../models/User");
const Payment = require("../models/Payment");
const asyncHandler = require("../utils/asyncHandler");
const cache = require("../utils/cache");
const { getProjectListKey, invalidateProjectListCache } = require("../utils/cache");
const sendEmail = require("../utils/sendEmail");
const uploadFile = require("../utils/cloudinaryUpload");
const ApiError = require("../utils/ApiError");

const PREMIUM_AMOUNT = 49900;
const isDemoPaymentMode = String(process.env.DEMO_PAYMENT_MODE || "false").toLowerCase() === "true";
const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  : null;

const generateDemoPaymentIds = () => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString("hex");
  return {
    orderId: `DEMO_ORDER_${timestamp}_${random}`,
    paymentId: `DEMO_PAY_${timestamp}_${random}`,
  };
};

exports.createProject = asyncHandler(async (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) throw new ApiError(400, "Project title is required");

  const uploadedImage = req.file ? await uploadFile(req.file, "projecthub/projects") : null;
  const project = await Project.create({
    ...req.body,
    ...(uploadedImage && { image: uploadedImage }),
    owner: req.user.id,
  });

  invalidateProjectListCache(req.user.id);
  res.status(201).json({ success: true, data: project });
});

exports.getProjects = asyncHandler(async (req, res) => {
  const key = getProjectListKey(req.user.id, req.query);
  const cached = cache.get(key);

  if (cached) {
    console.log("[CACHE HIT]", key);
    return res.set("X-Cache", "HIT").json(cached);
  }

  const filter = { owner: req.user.id };
  if (req.query.search) {
    filter.title = { $regex: req.query.search, $options: "i" };
  }

  const projects = await Project.find(filter).sort({ createdAt: -1 });
  const response = { success: true, count: projects.length, data: projects };
  cache.set(key, response, 60);
  console.log("[CACHE MISS]", key);
  res.set("X-Cache", "MISS").json(response);
});

exports.updateProject = asyncHandler(async (req, res) => {
  let project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, "Project not found");
  if (project.owner.toString() !== req.user.id) {
    throw new ApiError(403, "Not authorized to update this project");
  }

  const uploadedImage = req.file ? await uploadFile(req.file, "projecthub/projects") : project.image;
  project = await Project.findByIdAndUpdate(
    req.params.id,
    { ...req.body, image: uploadedImage },
    { new: true, runValidators: true },
  );

  invalidateProjectListCache(req.user.id);
  res.json({ success: true, data: project });
});

exports.deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, "Project not found");
  if (project.owner.toString() !== req.user.id) {
    throw new ApiError(403, "Not authorized to delete this project");
  }

  await project.deleteOne();
  invalidateProjectListCache(req.user.id);
  res.json({ success: true, message: "Deleted" });
});

exports.createDemoPaymentOrder = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, "User not found.");
  if (user.isPremium) throw new ApiError(400, "User is already premium.");

  const demoIds = generateDemoPaymentIds();

  res.json({
    success: true,
    mode: "demo",
    provider: "demo",
    order: {
      id: demoIds.orderId,
      amount: PREMIUM_AMOUNT,
      currency: "INR",
      receipt: `demo_premium_${user._id}_${Date.now()}`,
    },
    paymentId: demoIds.paymentId,
    key: null,
    message: "Demo payment ready",
  });
});

exports.createPaymentOrder = asyncHandler(async (req, res) => {
  if (isDemoPaymentMode) {
    return exports.createDemoPaymentOrder(req, res);
  }

  if (!razorpay) {
    throw new ApiError(500, "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }

  const amount = Number(req.body.amount || 499);
  if (!Number.isFinite(amount) || amount <= 0 || amount !== 499) {
    throw new ApiError(400, "Invalid premium amount.");
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  if (user.isPremium) {
    throw new ApiError(400, "User is already premium.");
  }

  let order;
  try {
    order = await razorpay.orders.create({
      amount: PREMIUM_AMOUNT,
      currency: "INR",
      receipt: `premium_${user._id}_${Date.now()}`,
      notes: { userId: user._id.toString(), plan: "premium" },
    });
  } catch (error) {
    const detail = error?.error?.description || error?.message || "Razorpay order creation failed.";
    throw new ApiError(400, `Razorpay order creation failed: ${detail}`);
  }

  res.json({
    success: true,
    order: {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    },
    key: process.env.RAZORPAY_KEY_ID,
  });
});

exports.verifyDemoPayment = asyncHandler(async (req, res) => {
  const { order_id, orderId, payment_id, paymentId, demo_order_id, demo_payment_id } = req.body;
  const resolvedOrderId = order_id || orderId || demo_order_id;
  const resolvedPaymentId = payment_id || paymentId || demo_payment_id;

  if (!resolvedOrderId || !resolvedPaymentId) {
    throw new ApiError(400, "Demo payment verification data is incomplete.");
  }

  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, "User not found.");
  if (user.isPremium) return res.json({ success: true, message: "Premium already active." });

  const existingPayment = await Payment.findOne({ user: user._id, paymentId: resolvedPaymentId });
  if (existingPayment) {
    throw new ApiError(409, "This demo payment has already been processed.");
  }

  const demoPayment = await Payment.create({
    user: user._id,
    provider: "demo",
    mode: "demo",
    orderId: resolvedOrderId,
    paymentId: resolvedPaymentId,
    amount: PREMIUM_AMOUNT,
    currency: "INR",
    status: "paid",
    verifiedAt: new Date(),
  });

  user.isPremium = true;
  await user.save();

  await sendEmail({
    to: user.email,
    subject: "Premium activated",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border-radius:12px;background:#f0fdf4;">
        <h2>Premium activated</h2>
        <p>Hi ${user.name}, your Premium plan is now active.</p>
        <p>Payment ID: ${resolvedPaymentId}</p>
        <p>Provider: Demo Payment</p>
      </div>
    `,
  });

  res.json({
    success: true,
    message: "Payment Successful",
    payment: {
      id: demoPayment.paymentId,
      orderId: demoPayment.orderId,
      amount: demoPayment.amount,
      currency: demoPayment.currency,
      provider: demoPayment.provider,
      status: demoPayment.status,
    },
  });
});

exports.verifyPayment = asyncHandler(async (req, res) => {
  if (isDemoPaymentMode) {
    return exports.verifyDemoPayment(req, res);
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ApiError(400, "Payment verification data is incomplete.");
  }

  if (!razorpay) {
    throw new ApiError(500, "Razorpay is not configured.");
  }

  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature.length !== razorpay_signature.length) {
    throw new ApiError(400, "Invalid Razorpay signature.");
  }

  const isValid = crypto.timingSafeEqual(
    Buffer.from(generatedSignature),
    Buffer.from(razorpay_signature),
  );

  if (!isValid) {
    throw new ApiError(400, "Invalid Razorpay signature.");
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  if (user.isPremium) {
    return res.json({ success: true, message: "Premium already active." });
  }

  user.isPremium = true;
  await user.save();

  await sendEmail({
    to: user.email,
    subject: "Premium activated",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border-radius:12px;background:#f0fdf4;">
        <h2>Premium activated</h2>
        <p>Hi ${user.name}, your Premium plan is now active.</p>
        <p>Payment ID: ${razorpay_payment_id}</p>
      </div>
    `,
  });

  res.json({ success: true, message: "Payment verified and Premium activated." });
});
