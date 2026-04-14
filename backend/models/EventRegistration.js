import mongoose from "mongoose";

const eventRegistrationSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ["pending_payment", "registered", "cancelled"],
      default: "pending_payment",
      index: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

eventRegistrationSchema.index({ userId: 1, eventId: 1 }, { unique: true });

export default mongoose.model("EventRegistration", eventRegistrationSchema);
