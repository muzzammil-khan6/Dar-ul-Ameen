const mongoose = require("mongoose");

const friendshipSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
      required: true,
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "blocked"],
      default: "pending",
      index: true,
    },
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
      default: null,
    },
    isMutedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "auth",
      },
    ],
  },
  { timestamps: true },
);

friendshipSchema.index({ requester: 1, recipient: 1 });
friendshipSchema.index({ recipient: 1, status: 1 });
friendshipSchema.index({ requester: 1, status: 1 });

module.exports = mongoose.model("Friendship", friendshipSchema);
