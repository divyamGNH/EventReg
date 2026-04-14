import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 140,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    location: {
      type: String,
      trim: true,
      maxlength: 180,
      default: "Online",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      max: 100000,
    },
    seatsBooked: {
      type: Number,
      default: 0,
      min: 0,
    },
    priceInCents: {
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
      enum: ["active", "deleted"],
      default: "active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

eventSchema.index({ status: 1, startDate: 1 });

export default mongoose.model("Event", eventSchema);
