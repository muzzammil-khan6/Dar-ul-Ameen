const mongoose = require("mongoose");

const inviteSchema = new mongoose.Schema(
  {
    inviter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
      required: true,
      index: true,
    },
    invitedEmail: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
    },
    invitedPhone: {
      type: String,
      default: null,
      trim: true,
    },
    invitedName: {
      type: String,
      default: null,
      trim: true,
    },
    inviteCode: {
      type: String,
      required: true,
      index: true,
    },
    inviteLink: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "joined", "rewarded"],
      default: "pending",
      index: true,
    },
    joinedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
      default: null,
    },
    joinedAt: {
      type: Date,
      default: null,
    },
    rewardedAt: {
      type: Date,
      default: null,
    },
    rewardAmount: {
      type: Number,
      default: 100,
    },
  },
  { timestamps: true },
);

inviteSchema.index({ inviter: 1, status: 1 });
inviteSchema.index({ invitedPhone: 1 });

module.exports = mongoose.model("Invite", inviteSchema);
