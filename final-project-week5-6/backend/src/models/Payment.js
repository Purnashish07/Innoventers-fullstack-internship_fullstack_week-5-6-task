const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    provider: { type: String, default: "demo", enum: ["razorpay", "demo", "manual"] },
    mode: { type: String, default: "demo", enum: ["demo", "live"] },
    orderId: { type: String, required: true },
    paymentId: { type: String, required: true },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ["pending", "paid", "failed", "cancelled"], default: "pending" },
    verifiedAt: { type: Date },
  },
  { timestamps: true },
);

paymentSchema.index({ user: 1, paymentId: 1 }, { unique: true });

module.exports = mongoose.model("Payment", paymentSchema);
