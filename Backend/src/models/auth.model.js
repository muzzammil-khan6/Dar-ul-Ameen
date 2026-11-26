//External Modules
const mongoose = require("mongoose");

const authSchema = mongoose.Schema({
  fullName: {
    type: String,
    required: [true, "Full name is required"],
    minlength: [3, "Full name must be at least 3 characters long"],
  },
  email: {
    type: String,
    required: [true, "Email address is required"],
    unique: true,
    match: [/\S+@\S+\.\S+/, "Email address is invalid"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters long"],
    select: false,
  },
  phone: {
    type: String,
    required: [true, "Phone number is required"],
  },
  city: {
    type: String,
    required: [true, "City is required"],
  },
  country: {
    type: String,
    required: [true, "Country is required"],
  },
  preferredLanguage: {
    type: String,
    enum: ["English", "Arabic", "Urdu", "Hindi", "en", "ar", "ur", "hi"],
    default: "English",
    required: [true, "Preferred language is required"],
  },
  role: [
    {
      type: String,
      enum: ["admin", "teacher", "student"],
      default: "student",
    },
  ],
  picture: {
    type: String,
    default:
      "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
  },
  bio: {
    type: String,
    default: "",
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  studentWallet: {
    type: Number,
    default: 0,
  },
  googleRefreshToken: {
    type: String,
    default: null,
  },
  isGoogleVerified: {
    type: Boolean,
    default: true,
  },
  teachingStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  referralCode: {
    type: String,
    sparse: true,
    index: true,
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "auth",
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // Backward compatibility fields (optional)
  fatherName: { type: String, default: "" },
  dateOfBirth: { type: Date, default: null },
  phoneNumber: { type: String, default: "" },
  address: { type: String, default: "" },
});

// Performance Indexes for high-frequency queries
authSchema.index({ role: 1, teachingStatus: 1, isBlocked: 1 });
authSchema.index({ city: 1, country: 1 });
authSchema.index({ phone: 1 });
authSchema.index({ phoneNumber: 1 });
authSchema.index({ createdAt: -1 });

const authModel = mongoose.model("auth", authSchema);
module.exports = authModel;
