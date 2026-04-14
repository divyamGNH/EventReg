import mongoose from "mongoose";

const adminActionLogSchema = new mongoose.Schema(
  {
    adminUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    actionType: {
      type: String,
      enum: ["CREATE_EVENT", "DELETE_EVENT", "VIEW_EVENT_REGISTRATIONS"],
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ["Event", "EventRegistration"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("AdminActionLog", adminActionLogSchema);
