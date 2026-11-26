const mongoose = require("mongoose");
const Message = require("../models/message.model");
const Friendship = require("../models/friendship.model");
const Auth = require("../models/auth.model");
const Booking = require("../models/booking.model");
const Trial = require("../models/trial.model");
const { getIO, isUserOnline } = require("../services/socket.service");

// Helper to determine if two users are allowed to chat 1v1
async function checkChatAccess(userAId, userBId) {
  if (userAId.toString() === userBId.toString()) {
    return { allowed: false, reason: "self" };
  }

  const friendship = await Friendship.findOne({
    $or: [
      { requester: userAId, recipient: userBId },
      { requester: userBId, recipient: userAId },
    ],
  });

  if (friendship && friendship.status === "blocked") {
    return {
      allowed: false,
      reason: "blocked",
      blockedBy: friendship.blockedBy,
      friendship,
    };
  }

  if (friendship && friendship.status === "accepted") {
    return { allowed: true, reason: "friends", friendship };
  }

  // Check 1v1 Teacher - Student relationship via active or past Booking
  const sharedBooking = await Booking.findOne({
    $or: [
      { teacher: userAId, student: userBId },
      { teacher: userBId, student: userAId },
    ],
    status: {
      $in: [
        "pending",
        "accepted_by_teacher",
        "payment_done, waiting_for_admin",
        "active",
        "confirmed",
        "completed",
      ],
    },
  });
  if (sharedBooking) {
    return { allowed: true, reason: "teacher_student_booking", friendship };
  }

  // Check 1v1 Teacher - Student relationship via active or past Trial
  const sharedTrial = await Trial.findOne({
    $or: [
      { teacher: userAId, student: userBId },
      { teacher: userBId, student: userAId },
    ],
    status: { $in: ["pending", "accepted", "completed"] },
  });
  if (sharedTrial) {
    return { allowed: true, reason: "teacher_student_trial", friendship };
  }

  // Check if students have same teacher
  const userABookings = await Booking.find({
    student: userAId,
    status: { $nin: ["cancelled", "payment_rejected", "expired"] },
  }).select("teacher");
  const userATrials = await Trial.find({
    student: userAId,
    status: { $nin: ["cancelled", "rejected"] },
  }).select("teacher");

  const aTeachers = [
    ...userABookings.map((b) => b.teacher.toString()),
    ...userATrials.map((t) => t.teacher.toString()),
  ];

  if (aTeachers.length > 0) {
    const userBShared = await Booking.findOne({
      student: userBId,
      teacher: { $in: aTeachers },
      status: { $nin: ["cancelled", "payment_rejected", "expired"] },
    });
    if (userBShared) {
      return { allowed: true, reason: "same_teacher", friendship };
    }
  }

  // Check if existing message history exists
  const existingMsg = await Message.findOne({
    $or: [
      { sender: userAId, receiver: userBId },
      { sender: userBId, receiver: userAId },
    ],
  });
  if (existingMsg) {
    return { allowed: true, reason: "existing_chat", friendship };
  }

  return {
    allowed: false,
    reason: "not_connected",
    friendship: friendship || null,
  };
}

// GET /api/chat/list - Get 1v1 conversation contacts for logged in user
async function getChatList(req, res) {
  try {
    const myId = req.user._id;

    // 1. Find all distinct users who have exchanged messages with current user
    const sentReceivers = await Message.distinct("receiver", { sender: myId });
    const receivedSenders = await Message.distinct("sender", { receiver: myId });

    // 2. Find all accepted friends
    const friendships = await Friendship.find({
      $or: [{ requester: myId }, { recipient: myId }],
      status: "accepted",
    });
    const friendIds = friendships.map((f) =>
      f.requester.toString() === myId.toString()
        ? f.recipient.toString()
        : f.requester.toString(),
    );

    // 3. Find connected teachers or students (active or completed 1v1 classes)
    const bookings = await Booking.find({
      $or: [{ student: myId }, { teacher: myId }],
      status: { $nin: ["cancelled", "payment_rejected", "expired"] },
    }).select("student teacher");

    const trials = await Trial.find({
      $or: [{ student: myId }, { teacher: myId }],
      status: { $nin: ["cancelled", "rejected"] },
    }).select("student teacher");

    const classPartnerIds = [
      ...bookings.map((b) =>
        b.student.toString() === myId.toString()
          ? b.teacher.toString()
          : b.student.toString(),
      ),
      ...trials.map((t) =>
        t.student.toString() === myId.toString()
          ? t.teacher.toString()
          : t.student.toString(),
      ),
    ];

    // Combine unique user IDs
    const allPartnerIdSet = new Set([
      ...sentReceivers.map((id) => id.toString()),
      ...receivedSenders.map((id) => id.toString()),
      ...friendIds,
      ...classPartnerIds,
    ]);
    allPartnerIdSet.delete(myId.toString());

    const partnerIds = Array.from(allPartnerIdSet);
    if (partnerIds.length === 0) {
      return res.status(200).json({ chats: [] });
    }

    const partners = await Auth.find({
      _id: { $in: partnerIds },
      isBlocked: { $ne: true },
    }).select(
      "fullName email picture role city country teachingStatus lastSeen",
    );

    // Fetch block/mute relationships
    const allFriendships = await Friendship.find({
      $or: [
        { requester: myId, recipient: { $in: partnerIds } },
        { recipient: myId, requester: { $in: partnerIds } },
      ],
    }).lean();

    const friendshipMap = new Map();
    allFriendships.forEach((f) => {
      const otherId =
        f.requester.toString() === myId.toString()
          ? f.recipient.toString()
          : f.requester.toString();
      friendshipMap.set(otherId, f);
    });

    const partnerObjectIds = partnerIds.map((id) => new mongoose.Types.ObjectId(id));

    // Batch query 1: Unread message counts for all partners in 1 aggregate query
    const unreadCounts = await Message.aggregate([
      {
        $match: {
          receiver: myId,
          sender: { $in: partnerObjectIds },
          isSeen: false,
        },
      },
      {
        $group: {
          _id: "$sender",
          count: { $sum: 1 },
        },
      },
    ]);
    const unreadMap = new Map();
    unreadCounts.forEach((u) => unreadMap.set(u._id.toString(), u.count));

    // Batch query 2: Latest message for all conversations in 1 aggregate query
    const latestMessages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: myId, receiver: { $in: partnerObjectIds } },
            { receiver: myId, sender: { $in: partnerObjectIds } },
          ],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$sender", myId] }, "$receiver", "$sender"],
          },
          lastMsg: { $first: "$$ROOT" },
        },
      },
    ]);
    const lastMsgMap = new Map();
    latestMessages.forEach((m) => lastMsgMap.set(m._id.toString(), m.lastMsg));

    // Build chat list with O(1) in-memory lookups
    const chatList = [];

    for (const p of partners) {
      const pId = p._id.toString();
      const lastMsg = lastMsgMap.get(pId) || null;
      const unreadCount = unreadMap.get(pId) || 0;

      const fs = friendshipMap.get(pId);
      const isMuted = fs?.isMutedBy?.some(
        (uid) => uid.toString() === myId.toString(),
      ) || false;
      const isBlocked = fs?.status === "blocked";
      const blockedByMe = isBlocked && fs?.blockedBy?.toString() === myId.toString();

      chatList.push({
        user: {
          _id: p._id,
          fullName: p.fullName,
          picture: p.picture,
          role: Array.isArray(p.role) ? p.role[0] : p.role,
          city: p.city,
          country: p.country,
          lastSeen: p.lastSeen,
          isOnline: isUserOnline(p._id),
        },
        lastMessage: lastMsg
          ? {
              _id: lastMsg._id,
              message: lastMsg.message,
              imageUrl: lastMsg.imageUrl,
              sender: lastMsg.sender,
              isSeen: lastMsg.isSeen,
              createdAt: lastMsg.createdAt,
            }
          : null,
        unreadCount,
        isMuted,
        isBlocked,
        blockedByMe,
      });
    }

    // Sort by latest message date (most recent first)
    chatList.sort((a, b) => {
      const timeA = a.lastMessage
        ? new Date(a.lastMessage.createdAt).getTime()
        : 0;
      const timeB = b.lastMessage
        ? new Date(b.lastMessage.createdAt).getTime()
        : 0;
      return timeB - timeA;
    });

    return res.status(200).json({ chats: chatList });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to load chat list", error: error.message });
  }
}

// GET /api/chat/:userId/messages - Get 1v1 message history
async function getMessages(req, res) {
  try {
    const myId = req.user._id;
    const { userId } = req.params;

    const partner = await Auth.findById(userId).select(
      "fullName email picture role city country teachingStatus lastSeen",
    );
    if (!partner) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check 1v1 Chat Access Rule
    const access = await checkChatAccess(myId, userId);
    if (!access.allowed && access.reason === "blocked") {
      // Still allow viewing history if blocked, but flag it
    }

    // Mark all unread incoming messages as seen
    const unreadUpdated = await Message.updateMany(
      { sender: userId, receiver: myId, isSeen: false },
      { $set: { isSeen: true, seenAt: new Date() } },
    );

    if (unreadUpdated.modifiedCount > 0) {
      const io = getIO();
      if (io) {
        io.to(`user_${userId}`).emit("messagesSeen", {
          seenBy: myId.toString(),
          seenAt: new Date(),
        });
      }
    }

    const messages = await Message.find({
      $or: [
        { sender: myId, receiver: userId },
        { sender: userId, receiver: myId },
      ],
    })
      .sort({ createdAt: 1 })
      .lean();

    const friendship = access.friendship;
    const isMuted = friendship?.isMutedBy?.some(
      (uid) => uid.toString() === myId.toString(),
    ) || false;
    const isBlocked = friendship?.status === "blocked";
    const blockedByMe = isBlocked && friendship?.blockedBy?.toString() === myId.toString();

    return res.status(200).json({
      partner: {
        _id: partner._id,
        fullName: partner.fullName,
        picture: partner.picture,
        role: Array.isArray(partner.role) ? partner.role[0] : partner.role,
        city: partner.city,
        country: partner.country,
        lastSeen: partner.lastSeen,
        isOnline: isUserOnline(partner._id),
      },
      messages,
      accessInfo: {
        canChat: access.allowed,
        reason: access.reason,
        isMuted,
        isBlocked,
        blockedByMe,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to load messages", error: error.message });
  }
}

// POST /api/chat/send - Send 1v1 message
async function sendMessage(req, res) {
  try {
    const myId = req.user._id;
    const { receiverId, message, imageUrl } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: "Receiver ID is required" });
    }

    if ((!message || !message.trim()) && !imageUrl) {
      return res
        .status(400)
        .json({ message: "Message text or image is required" });
    }

    const receiver = await Auth.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    // Verify 1v1 Chat Access Rule
    const access = await checkChatAccess(myId, receiverId);
    if (!access.allowed) {
      if (access.reason === "blocked") {
        return res
          .status(403)
          .json({ message: "Cannot send message. User is blocked." });
      }
      return res.status(403).json({
        message:
          "You can only chat with users you have a connection with (same teacher/class or accepted friend request). Please send a friend request first.",
        requireFriendRequest: true,
      });
    }

    const newMsg = await Message.create({
      sender: myId,
      receiver: receiverId,
      message: message ? message.trim() : "",
      imageUrl: imageUrl || null,
      isDelivered: true,
      deliveredAt: new Date(),
      isSeen: false,
    });

    // Real-time delivery via Socket.io
    const io = getIO();
    if (io) {
      io.to(`user_${receiverId}`).emit("newMessage", newMsg);
      io.to(`user_${myId}`).emit("newMessage", newMsg);
    }

    return res.status(201).json({
      message: "Message sent successfully",
      data: newMsg,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to send message", error: error.message });
  }
}

// PUT /api/chat/:userId/seen - Mark messages as seen
async function markSeen(req, res) {
  try {
    const myId = req.user._id;
    const { userId } = req.params;

    const result = await Message.updateMany(
      { sender: userId, receiver: myId, isSeen: false },
      { $set: { isSeen: true, seenAt: new Date() } },
    );

    const io = getIO();
    if (io && result.modifiedCount > 0) {
      io.to(`user_${userId}`).emit("messagesSeen", {
        seenBy: myId.toString(),
        seenAt: new Date(),
      });
    }

    return res.status(200).json({ success: true, count: result.modifiedCount });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to mark seen", error: error.message });
  }
}

// POST /api/chat/:userId/block - Block a user
async function blockUser(req, res) {
  try {
    const myId = req.user._id;
    const { userId } = req.params;

    let friendship = await Friendship.findOne({
      $or: [
        { requester: myId, recipient: userId },
        { requester: userId, recipient: myId },
      ],
    });

    if (friendship) {
      friendship.status = "blocked";
      friendship.blockedBy = myId;
      await friendship.save();
    } else {
      friendship = await Friendship.create({
        requester: myId,
        recipient: userId,
        status: "blocked",
        blockedBy: myId,
      });
    }

    const io = getIO();
    if (io) {
      io.to(`user_${userId}`).emit("userBlocked", { blockedBy: myId });
    }

    return res
      .status(200)
      .json({ message: "User blocked successfully", friendship });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to block user", error: error.message });
  }
}

// POST /api/chat/:userId/unblock - Unblock a user
async function unblockUser(req, res) {
  try {
    const myId = req.user._id;
    const { userId } = req.params;

    const friendship = await Friendship.findOne({
      $or: [
        { requester: myId, recipient: userId },
        { requester: userId, recipient: myId },
      ],
      status: "blocked",
    });

    if (friendship) {
      if (friendship.blockedBy && friendship.blockedBy.toString() !== myId.toString()) {
        return res
          .status(403)
          .json({ message: "You were blocked by the other user and cannot unblock them." });
      }
      friendship.status = "accepted";
      friendship.blockedBy = null;
      await friendship.save();
    }

    return res
      .status(200)
      .json({ message: "User unblocked successfully", friendship });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to unblock user", error: error.message });
  }
}

// POST /api/chat/:userId/mute - Mute chat
async function muteUser(req, res) {
  try {
    const myId = req.user._id;
    const { userId } = req.params;

    let friendship = await Friendship.findOne({
      $or: [
        { requester: myId, recipient: userId },
        { requester: userId, recipient: myId },
      ],
    });

    if (!friendship) {
      friendship = await Friendship.create({
        requester: myId,
        recipient: userId,
        status: "accepted",
        isMutedBy: [myId],
      });
    } else {
      if (!friendship.isMutedBy.some((id) => id.toString() === myId.toString())) {
        friendship.isMutedBy.push(myId);
        await friendship.save();
      }
    }

    return res.status(200).json({ message: "Chat muted", isMuted: true });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to mute chat", error: error.message });
  }
}

// POST /api/chat/:userId/unmute - Unmute chat
async function unmuteUser(req, res) {
  try {
    const myId = req.user._id;
    const { userId } = req.params;

    const friendship = await Friendship.findOne({
      $or: [
        { requester: myId, recipient: userId },
        { requester: userId, recipient: myId },
      ],
    });

    if (friendship && friendship.isMutedBy) {
      friendship.isMutedBy = friendship.isMutedBy.filter(
        (id) => id.toString() !== myId.toString(),
      );
      await friendship.save();
    }

    return res.status(200).json({ message: "Chat unmuted", isMuted: false });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to unmute chat", error: error.message });
  }
}

module.exports = {
  getChatList,
  getMessages,
  sendMessage,
  markSeen,
  blockUser,
  unblockUser,
  muteUser,
  unmuteUser,
};
