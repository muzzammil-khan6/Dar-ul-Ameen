const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
      required: true,
    },
    senderRole: {
      type: String,
      enum: ["student", "teacher", "admin"],
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: [true, "Message cannot be empty"],
      trim: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Chat", chatSchema);
