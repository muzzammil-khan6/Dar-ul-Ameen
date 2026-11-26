const express = require("express");
const path = require("path");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "https://s45mkq2p-3000.inc1.devtunnels.ms",
    ],
    credentials: true,
  }),
);

app.use(express.json({ limit: "50mb" }));
const publicDir = path.join(__dirname, "..", "public");

app.use(express.static(publicDir));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// Local Modules
const authRoutes = require("./routes/auth.route");
const adminRoutes = require("./routes/admin.route");
const teacherRoutes = require("./routes/teacher.route");
const studentRoutes = require("./routes/student.route");
const publicTeachersRoutes = require("./routes/publicTeachers.route");
const bookingRoutes = require("./routes/booking.route");
const classRoutes = require("./routes/class.route");
const paymentRoutes = require("./routes/payment.route");
const reviewRoutes = require("./routes/review.route");
const trialRoutes = require("./routes/trial.route");
const chatRoutes = require("./routes/chat.route");
const inviteRoutes = require("./routes/invite.route");
const friendRoutes = require("./routes/friend.route");

// APIs
app.get("/api/health", (req, res) => {
  const mongoose = require("mongoose");
  res.json({
    status: "ok",
    mongooseReadyState: mongoose.connection.readyState,
    readyStateDesc: [
      "disconnected",
      "connected",
      "connecting",
      "disconnecting",
    ][mongoose.connection.readyState],
  });
});
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/teachers", publicTeachersRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/trials", trialRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/invites", inviteRoutes);
app.use("/api/friends", friendRoutes);

app.get("*name", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

module.exports = app;
