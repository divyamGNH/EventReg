import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    registrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventRegistration",
      required: true,
      unique: true,
      index: true,
    },
    amountInCents: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "inr",
      lowercase: true,
      trim: true,
      maxlength: 10,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "expired", "refunded"],
      default: "pending",
      index: true,
    },
    stripeCheckoutSessionId: {
      type: String,
      index: true,
      sparse: true,
    },
    stripePaymentIntentId: {
      type: String,
      index: true,
      sparse: true,
    },
    stripeCustomerId: {
      type: String,
      index: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ stripeCheckoutSessionId: 1 }, { unique: true, sparse: true });

export default mongoose.model("Payment", paymentSchema);
