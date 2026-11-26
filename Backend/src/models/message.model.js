const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
      required: true,
      index: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
      required: true,
      index: true,
    },
    message: {
      type: String,
      default: "",
      trim: true,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    isSeen: {
      type: Boolean,
      default: false,
      index: true,
    },
    seenAt: {
      type: Date,
      default: null,
    },
    isDelivered: {
      type: Boolean,
      default: true,
    },
    deliveredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

// Compound indexes for fast message history retrieval and unread counters
messageSchema.index({ sender: 1, receiver: 1, createdAt: 1 });
messageSchema.index({ receiver: 1, isSeen: 1 });

module.exports = mongoose.model("Message", messageSchema);
