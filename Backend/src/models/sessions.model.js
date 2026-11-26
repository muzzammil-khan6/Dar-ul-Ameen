//External Modules
const mongoose = require("mongoose");

const sessionSchema = mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: [true, "User ID is required"],
    },
    refreshTokenHash: {
      type: String,
    },
    ip: {
      type: String,
      required: [true, "IP address is required"],
    },
    userAgent: {
      type: String,
      required: [true, "User agent is required"],
    },
    activeRole: {
      type: String,
      enum: ["student", "teacher", "admin"],
      default: null,
    },
    revoked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const sessionModel = mongoose.model("session", sessionSchema);
module.exports = sessionModel;
