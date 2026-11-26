const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const Auth = require("../models/auth.model");

let io = null;
// Map: userId (string) -> Set of socket IDs
const onlineUsers = new Map();

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: [process.env.FRONTEND_URL || "http://localhost:5173"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    let currentUserId = null;

    // Optional handshake token verification
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded && decoded.Id) {
          currentUserId = decoded.Id.toString();
          addUserSocket(currentUserId, socket.id);
          socket.join(`user_${currentUserId}`);
          socket.join(currentUserId);

          if (
            decoded.role === "admin" ||
            (Array.isArray(decoded.role) && decoded.role.includes("admin"))
          ) {
            socket.join("admin");
          }

          io.emit("userStatusChange", {
            userId: currentUserId,
            isOnline: true,
            lastSeen: new Date(),
          });
        }
      } catch (err) {
        // Handshake token invalid; user can still identify via joinUser
      }
    }

    // Explicit user registration on socket
    socket.on("joinUser", async ({ userId, role }) => {
      if (!userId) return;
      currentUserId = userId.toString();
      addUserSocket(currentUserId, socket.id);
      socket.join(`user_${currentUserId}`);
      socket.join(currentUserId);

      // Check if user is admin
      try {
        const userDoc = await Auth.findById(currentUserId)
          .select("role")
          .lean();
        const isAdmin =
          role === "admin" ||
          userDoc?.role === "admin" ||
          (Array.isArray(userDoc?.role) && userDoc.role.includes("admin"));
        if (isAdmin) {
          socket.join("admin");
        }
      } catch (e) {}

      await Auth.findByIdAndUpdate(currentUserId, {
        $set: { lastSeen: new Date() },
      }).catch(() => {});

      io.emit("userStatusChange", {
        userId: currentUserId,
        isOnline: true,
        lastSeen: new Date(),
      });
    });

    socket.on("joinAdmin", () => {
      socket.join("admin");
    });

    // 1v1 Room join
    socket.on("joinRoom", ({ partnerId }) => {
      if (!currentUserId || !partnerId) return;
      const roomId = [currentUserId, partnerId.toString()].sort().join("_");
      socket.join(`chat_${roomId}`);
    });

    // 1v1 Room leave
    socket.on("leaveRoom", ({ partnerId }) => {
      if (!currentUserId || !partnerId) return;
      const roomId = [currentUserId, partnerId.toString()].sort().join("_");
      socket.leave(`chat_${roomId}`);
    });

    // Real-time typing indicators
    socket.on("typing", ({ toUserId, fromName }) => {
      if (!toUserId || !currentUserId) return;
      io.to(`user_${toUserId}`)
        .to(toUserId.toString())
        .emit("userTyping", {
          fromUserId: currentUserId,
          fromName: fromName || "User",
        });
    });

    socket.on("stopTyping", ({ toUserId }) => {
      if (!toUserId || !currentUserId) return;
      io.to(`user_${toUserId}`)
        .to(toUserId.toString())
        .emit("userStoppedTyping", {
          fromUserId: currentUserId,
        });
    });

    // Mark seen notification
    socket.on("markSeen", ({ senderId, receiverId }) => {
      const targetId = senderId || currentUserId;
      if (receiverId) {
        io.to(`user_${targetId}`).to(targetId.toString()).emit("messagesSeen", {
          seenBy: receiverId,
          seenAt: new Date(),
        });
      }
    });

    // Check online status query
    socket.on("checkOnline", ({ userIds }, callback) => {
      if (typeof callback !== "function") return;
      const result = {};
      if (Array.isArray(userIds)) {
        userIds.forEach((uId) => {
          result[uId] = isUserOnline(uId);
        });
      }
      callback(result);
    });

    // Disconnect handling
    socket.on("disconnect", async () => {
      if (currentUserId) {
        removeUserSocket(currentUserId, socket.id);
        if (!isUserOnline(currentUserId)) {
          const lastSeen = new Date();
          await Auth.findByIdAndUpdate(currentUserId, {
            $set: { lastSeen },
          }).catch(() => {});

          io.emit("userStatusChange", {
            userId: currentUserId,
            isOnline: false,
            lastSeen,
          });
        }
      }
    });
  });

  // Background worker: check for expired 24-hour bookings every 60 seconds
  setInterval(async () => {
    try {
      const Booking = require("../models/booking.model");
      const expiredBookings = await Booking.find({
        status: "accepted_by_teacher",
        expiresAt: { $lt: new Date() },
      });

      if (expiredBookings.length > 0) {
        for (const b of expiredBookings) {
          b.status = "expired";
          await b.save();

          emitToUser(b.student, "bookingUpdated", {
            booking: b,
            action: "expired",
            message: "Booking request expired after 24 hours.",
          });
          emitToUser(b.teacher, "bookingUpdated", {
            booking: b,
            action: "expired",
            message: "Booking request expired after 24 hours.",
          });
          emitToAdmin("bookingUpdated", {
            booking: b,
            action: "expired",
          });
        }
      }
    } catch (e) {
      // safe background catch
    }
  }, 60000);

  return io;
}

function addUserSocket(userId, socketId) {
  const strId = userId.toString();
  if (!onlineUsers.has(strId)) {
    onlineUsers.set(strId, new Set());
  }
  onlineUsers.get(strId).add(socketId);
}

function removeUserSocket(userId, socketId) {
  const strId = userId.toString();
  if (onlineUsers.has(strId)) {
    const sockets = onlineUsers.get(strId);
    sockets.delete(socketId);
    if (sockets.size === 0) {
      onlineUsers.delete(strId);
    }
  }
}

function isUserOnline(userId) {
  if (!userId) return false;
  const strId = userId.toString();
  return onlineUsers.has(strId) && onlineUsers.get(strId).size > 0;
}

function getIO() {
  return io;
}

function emitToUser(userId, event, data) {
  if (!io || !userId) return;
  const strId = userId.toString();
  io.to(`user_${strId}`).to(strId).emit(event, data);
}

function emitToAdmin(event, data) {
  if (!io) return;
  io.to("admin").emit(event, data);
}

function broadcastEvent(event, data) {
  if (!io) return;
  io.emit(event, data);
}

module.exports = {
  initSocket,
  getIO,
  isUserOnline,
  emitToUser,
  emitToAdmin,
  broadcastEvent,
};
