const Friendship = require("../models/friendship.model");
const Auth = require("../models/auth.model");
const Booking = require("../models/booking.model");
const Trial = require("../models/trial.model");
const Schedule = require("../models/schedule.model");
const Invite = require("../models/invite.model");
const { getIO } = require("../services/socket.service");

// Helper to normalize phone numbers for accurate matching
function normalizePhone(p) {
  if (!p) return "";
  const digits = p.toString().replace(/\D/g, "");
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

// GET /api/friends/suggestions - People You May Know (1v1 ONLY)
async function getSuggestions(req, res) {
  try {
    const myId = req.user._id;
    const myCity = (req.user.city || "").trim().toLowerCase();
    const myCountry = (req.user.country || "").trim().toLowerCase();
    const myPhone = req.user.phone || req.user.phoneNumber || "";
    const myPhoneNorm = normalizePhone(myPhone);

    const q = (req.query.q || req.query.query || req.query.search || "").trim();
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // 1. Existing friendships / blocks
    const myFriendships = await Friendship.find({
      $or: [{ requester: myId }, { recipient: myId }],
    });

    const acceptedFriendIds = new Set();
    const blockedUserIds = new Set();
    const pendingSentMap = new Map(); // targetId -> friendshipId
    const pendingReceivedMap = new Map(); // targetId -> friendshipId

    myFriendships.forEach((f) => {
      const isRequester = f.requester.toString() === myId.toString();
      const otherId = isRequester
        ? f.recipient.toString()
        : f.requester.toString();

      if (f.status === "accepted") {
        acceptedFriendIds.add(otherId);
      } else if (f.status === "blocked") {
        blockedUserIds.add(otherId);
      } else if (f.status === "pending") {
        if (isRequester) {
          pendingSentMap.set(otherId, f._id);
        } else {
          pendingReceivedMap.set(otherId, f._id);
        }
      }
    });

    // 2. Phone contacts from Invites stored in Database
    const myInvites = await Invite.find({ inviter: myId });
    const myInvitedPhones = new Set();
    myInvites.forEach((inv) => {
      if (inv.invitedPhone) {
        const norm = normalizePhone(inv.invitedPhone);
        if (norm) myInvitedPhones.add(norm);
      }
    });

    const usersWhoInvitedMyPhone = new Set();
    if (myPhoneNorm) {
      const phoneVariants = [myPhone, myPhoneNorm];
      if (myPhone.startsWith("+92")) phoneVariants.push("0" + myPhone.slice(3));
      if (myPhone.startsWith("0")) phoneVariants.push("+92" + myPhone.slice(1));

      const invitesToMe = await Invite.find({
        invitedPhone: { $in: phoneVariants },
      }).lean();

      invitesToMe.forEach((inv) => {
        if (normalizePhone(inv.invitedPhone) === myPhoneNorm && inv.inviter) {
          usersWhoInvitedMyPhone.add(inv.inviter.toString());
        }
      });
    }

    // 3. My Learning / Teaching Context
    const myBookings = await Booking.find({
      $or: [{ student: myId }, { teacher: myId }],
      status: { $nin: ["cancelled", "payment_rejected", "expired"] },
    })
      .populate("teacher", "fullName")
      .lean();

    const myTrials = await Trial.find({
      $or: [{ student: myId }, { teacher: myId }],
      status: { $nin: ["cancelled", "rejected"] },
    })
      .populate("teacher", "fullName")
      .lean();

    // Gather my teachers (id -> name)
    const myTeachersMap = new Map();
    myBookings.forEach((b) => {
      if (b.teacher?._id) {
        myTeachersMap.set(
          b.teacher._id.toString(),
          b.teacher.fullName || "Teacher",
        );
      }
    });
    myTrials.forEach((t) => {
      if (t.teacher?._id) {
        myTeachersMap.set(
          t.teacher._id.toString(),
          t.teacher.fullName || "Teacher",
        );
      }
    });

    // Gather my subjects
    const mySubjects = new Set();
    myBookings.forEach((b) => {
      if (b.subject) mySubjects.add(b.subject.toLowerCase());
    });
    myTrials.forEach((t) => {
      if (t.subject) mySubjects.add(t.subject.toLowerCase());
    });

    // If teacher, add subjects from Schedule
    const mySchedule = await Schedule.findOne({ teacher: myId });
    if (mySchedule && mySchedule.subjects) {
      mySchedule.subjects.forEach((s) => {
        if (s.name) mySubjects.add(s.name.toLowerCase());
      });
    }

    // Gather my time slots: Array of { startTime, endTime, day }
    const myTimeSlots = [];
    myBookings.forEach((b) => {
      if (b.timeSlot?.startTime) {
        myTimeSlots.push({
          startTime: b.timeSlot.startTime,
          endTime: b.timeSlot.endTime,
          day: b.timeSlot.day,
        });
      }
    });
    myTrials.forEach((t) => {
      if (t.startTime) {
        myTimeSlots.push({
          startTime: t.startTime,
          endTime: t.endTime,
          day: t.day,
        });
      }
    });

    // 4. Find candidates (all users excluding self, accepted friends, and blocked users)
    const excludeIds = [myId, ...Array.from(acceptedFriendIds), ...Array.from(blockedUserIds)];

    const candidateFilter = {
      _id: { $nin: excludeIds },
      isBlocked: { $ne: true },
    };

    if (q) {
      const escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = new RegExp(escapedQ, "i");
      const rawDigits = q.replace(/\D/g, "");
      const orList = [
        { fullName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { phoneNumber: searchRegex },
      ];
      if (rawDigits.length >= 3) {
        orList.push({ phone: { $regex: rawDigits } });
        orList.push({ phoneNumber: { $regex: rawDigits } });
        if (rawDigits.startsWith("0") && rawDigits.length >= 4) {
          orList.push({ phone: { $regex: rawDigits.slice(1) } });
          orList.push({ phoneNumber: { $regex: rawDigits.slice(1) } });
        }
        if (rawDigits.startsWith("92") && rawDigits.length >= 5) {
          orList.push({ phone: { $regex: rawDigits.slice(2) } });
          orList.push({ phoneNumber: { $regex: rawDigits.slice(2) } });
        }
      }
      candidateFilter.$or = orList;
    }

    const candidateUsers = await Auth.find(candidateFilter)
      .select("fullName email picture city country phone phoneNumber role lastSeen")
      .limit(q ? 30 : 50)
      .lean();

    if (candidateUsers.length === 0) {
      return res.status(200).json({ suggestions: [], total: 0, hasMore: false });
    }

    const candidateIds = candidateUsers.map((u) => u._id);

    // Fetch candidate bookings and trials
    const candBookings = await Booking.find({
      $or: [{ student: { $in: candidateIds } }, { teacher: { $in: candidateIds } }],
      status: { $nin: ["cancelled", "payment_rejected", "expired"] },
    })
      .populate("teacher", "fullName")
      .lean();

    const candTrials = await Trial.find({
      $or: [{ student: { $in: candidateIds } }, { teacher: { $in: candidateIds } }],
      status: { $nin: ["cancelled", "rejected"] },
    })
      .populate("teacher", "fullName")
      .lean();

    // Candidate Bookings Map: userId -> list of bookings
    const candBookingsMap = new Map();
    candBookings.forEach((b) => {
      const uId = (b.student?._id || b.student || "").toString();
      if (!candBookingsMap.has(uId)) candBookingsMap.set(uId, []);
      candBookingsMap.get(uId).push(b);
    });

    // Candidate Trials Map: userId -> list of trials
    const candTrialsMap = new Map();
    candTrials.forEach((t) => {
      const uId = (t.student?._id || t.student || "").toString();
      if (!candTrialsMap.has(uId)) candTrialsMap.set(uId, []);
      candTrialsMap.get(uId).push(t);
    });

    // Mutual friends map: candidateId -> count of mutual accepted friends
    const candFriendships = await Friendship.find({
      $or: [
        { requester: { $in: candidateIds }, status: "accepted" },
        { recipient: { $in: candidateIds }, status: "accepted" },
      ],
    }).lean();

    const candFriendsMap = new Map(); // candidateId -> Set of friendIds
    candFriendships.forEach((f) => {
      const rId = f.requester.toString();
      const recId = f.recipient.toString();
      if (candidateIds.some((id) => id.toString() === rId)) {
        if (!candFriendsMap.has(rId)) candFriendsMap.set(rId, new Set());
        candFriendsMap.get(rId).add(recId);
      }
      if (candidateIds.some((id) => id.toString() === recId)) {
        if (!candFriendsMap.has(recId)) candFriendsMap.set(recId, new Set());
        candFriendsMap.get(recId).add(rId);
      }
    });

    // Score and generate reasons for each candidate based on phone numbers, city, and country stored in DB
    const scoredSuggestions = [];

    for (const cand of candidateUsers) {
      const cId = cand._id.toString();
      let score = 0;
      let reason = "";
      let priority = 5;

      const candCity = (cand.city || "").trim().toLowerCase();
      const candCountry = (cand.country || "").trim().toLowerCase();
      const candPhone = cand.phone || cand.phoneNumber || "";
      const candPhoneNorm = normalizePhone(candPhone);

      const userBookings = candBookingsMap.get(cId) || [];
      const userTrials = candTrialsMap.get(cId) || [];

      // 0. Search Query Match (Highest Score - 150)
      if (q) {
        const escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const searchRegex = new RegExp(escapedQ, "i");
        const digits = q.replace(/\D/g, "");
        if (digits.length >= 3 && candPhone.replace(/\D/g, "").includes(digits)) {
          score = 150;
          priority = 1;
          reason = `Matched by Phone (${candPhone})`;
        } else if (cand.email && searchRegex.test(cand.email)) {
          score = 145;
          priority = 1;
          reason = `Matched by Email (${cand.email})`;
        } else if (cand.fullName && searchRegex.test(cand.fullName)) {
          score = 140;
          priority = 1;
          reason = `Matched by Name (${cand.fullName})`;
        } else if (candPhone && searchRegex.test(candPhone)) {
          score = 150;
          priority = 1;
          reason = `Matched by Phone (${candPhone})`;
        }
      }

      // 1. Phone number match from Invites / Contacts in Database (Score 100)
      if (score < 100) {
        if (candPhoneNorm && myInvitedPhones.has(candPhoneNorm)) {
          score = 100;
          priority = 1;
          reason = "From Your Phone Contacts";
        } else if (usersWhoInvitedMyPhone.has(cId)) {
          score = 100;
          priority = 1;
          reason = "Connected via Phone Contact";
        }
      }

      // 2. Same City and Same Country match stored in Database (Score 90)
      if (
        score < 90 &&
        candCity &&
        myCity &&
        candCity === myCity &&
        candCountry &&
        myCountry &&
        candCountry === myCountry
      ) {
        score = 90;
        priority = 2;
        reason = `Same City & Country - ${cand.city}, ${cand.country}`;
      }

      // 3. Same City match stored in Database (Score 85)
      if (score < 85 && candCity && myCity && candCity === myCity) {
        score = 85;
        priority = 2;
        reason = `Both from ${cand.city}`;
      }

      // 4. Same Teacher match (Score 80)
      if (score < 80) {
        let sharedTeacherName = null;
        for (const b of userBookings) {
          const tId = (b.teacher?._id || b.teacher || "").toString();
          if (myTeachersMap.has(tId)) {
            sharedTeacherName = myTeachersMap.get(tId);
            break;
          }
        }
        if (!sharedTeacherName) {
          for (const t of userTrials) {
            const tId = (t.teacher?._id || t.teacher || "").toString();
            if (myTeachersMap.has(tId)) {
              sharedTeacherName = myTeachersMap.get(tId);
              break;
            }
          }
        }
        if (sharedTeacherName) {
          score = 80;
          priority = 3;
          reason = `Same Teacher - ${sharedTeacherName}`;
        }
      }

      // 5. Same Country match stored in Database (Score 75)
      if (score < 75 && candCountry && myCountry && candCountry === myCountry) {
        score = 75;
        priority = 3;
        reason = `Both from ${cand.country}`;
      }

      // 6. Same Time Slot match (Score 70)
      if (score < 70) {
        let matchingSlot = null;
        for (const b of userBookings) {
          if (b.timeSlot?.startTime) {
            const match = myTimeSlots.find(
              (ms) =>
                ms.startTime === b.timeSlot.startTime &&
                ms.endTime === b.timeSlot.endTime,
            );
            if (match) {
              matchingSlot = match;
              break;
            }
          }
        }
        if (!matchingSlot) {
          for (const t of userTrials) {
            if (t.startTime) {
              const match = myTimeSlots.find(
                (ms) =>
                  ms.startTime === t.startTime && ms.endTime === t.endTime,
              );
              if (match) {
                matchingSlot = match;
                break;
              }
            }
          }
        }
        if (matchingSlot) {
          score = 70;
          priority = 4;
          reason = `Same Time Slot (${matchingSlot.startTime} - ${matchingSlot.endTime})`;
        }
      }

      // 7. Same Course / Subject match (Score 65)
      if (score < 65) {
        let sharedSubject = null;
        for (const b of userBookings) {
          if (b.subject && mySubjects.has(b.subject.toLowerCase())) {
            sharedSubject = b.subject;
            break;
          }
        }
        if (!sharedSubject) {
          for (const t of userTrials) {
            if (t.subject && mySubjects.has(t.subject.toLowerCase())) {
              sharedSubject = t.subject;
              break;
            }
          }
        }
        if (sharedSubject) {
          score = 65;
          priority = 4;
          reason = `Both study ${sharedSubject}`;
        }
      }

      // 8. Mutual Friends match (Score 60)
      if (score < 60) {
        const candFriends = candFriendsMap.get(cId) || new Set();
        let mutualCount = 0;
        for (const fid of candFriends) {
          if (acceptedFriendIds.has(fid)) {
            mutualCount++;
          }
        }
        if (mutualCount > 0) {
          score = 60 + mutualCount;
          priority = 5;
          reason = `${mutualCount} mutual friend${mutualCount > 1 ? "s" : ""}`;
        }
      }

      // 9. Fallback: Matching based on phone number or location stored in DB (Score 50)
      if (score === 0) {
        score = 50;
        priority = 5;
        if (cand.city && cand.country) {
          reason = `Based in ${cand.city}, ${cand.country}`;
        } else if (cand.city) {
          reason = `Based in ${cand.city}`;
        } else if (cand.country) {
          reason = `Based in ${cand.country}`;
        } else if (candPhone) {
          reason = `Phone Contact (${candPhone})`;
        } else {
          reason = "Member of Dar-ul-Ameen";
        }
      }

      // Connection Status with current user
      let connectionStatus = "none";
      let friendshipId = null;

      if (pendingSentMap.has(cId)) {
        connectionStatus = "pending_sent";
        friendshipId = pendingSentMap.get(cId);
      } else if (pendingReceivedMap.has(cId)) {
        connectionStatus = "pending_received";
        friendshipId = pendingReceivedMap.get(cId);
      }

      scoredSuggestions.push({
        user: {
          _id: cand._id,
          fullName: cand.fullName,
          email: cand.email,
          picture: cand.picture,
          city: cand.city,
          country: cand.country,
          phone: cand.phone || cand.phoneNumber,
          role: Array.isArray(cand.role) ? cand.role[0] : cand.role,
        },
        reason,
        priority,
        score,
        connectionStatus,
        friendshipId,
      });
    }

    // Sort by score descending (Highest Priority first)
    scoredSuggestions.sort((a, b) => b.score - a.score);

    const total = scoredSuggestions.length;
    const paginated = scoredSuggestions.slice(skip, skip + limit);
    const hasMore = skip + limit < total;

    return res.status(200).json({
      suggestions: paginated,
      total,
      hasMore,
      page,
      limit,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to load suggestions", error: error.message });
  }
}

// GET /api/friends/search - Find people by Full Name, Email, or Phone Number
async function searchPeople(req, res) {
  try {
    const myId = req.user._id;
    const query = (req.query.q || req.query.query || req.query.search || "").trim();

    // 1. Existing friendships / blocks
    const myFriendships = await Friendship.find({
      $or: [{ requester: myId }, { recipient: myId }],
    });

    const acceptedFriendIds = new Set();
    const blockedUserIds = new Set();
    const pendingSentMap = new Map();
    const pendingReceivedMap = new Map();

    myFriendships.forEach((f) => {
      const isRequester = f.requester.toString() === myId.toString();
      const otherId = isRequester ? f.recipient.toString() : f.requester.toString();

      if (f.status === "accepted") {
        acceptedFriendIds.add(otherId);
      } else if (f.status === "blocked") {
        blockedUserIds.add(otherId);
      } else if (f.status === "pending") {
        if (isRequester) {
          pendingSentMap.set(otherId, f._id);
        } else {
          pendingReceivedMap.set(otherId, f._id);
        }
      }
    });

    // 2. Build Search Filter
    const filter = {
      _id: { $nin: [myId, ...Array.from(blockedUserIds)] },
      isBlocked: { $ne: true },
    };

    if (query) {
      const escapedQ = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = new RegExp(escapedQ, "i");
      const rawDigits = query.replace(/\D/g, "");
      const orList = [
        { fullName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { phoneNumber: searchRegex },
      ];
      if (rawDigits.length >= 3) {
        orList.push({ phone: { $regex: rawDigits } });
        orList.push({ phoneNumber: { $regex: rawDigits } });
        if (rawDigits.startsWith("0") && rawDigits.length >= 4) {
          orList.push({ phone: { $regex: rawDigits.slice(1) } });
          orList.push({ phoneNumber: { $regex: rawDigits.slice(1) } });
        }
        if (rawDigits.startsWith("92") && rawDigits.length >= 5) {
          orList.push({ phone: { $regex: rawDigits.slice(2) } });
          orList.push({ phoneNumber: { $regex: rawDigits.slice(2) } });
        }
      }
      filter.$or = orList;
    }

    const matchedUsers = await Auth.find(filter)
      .select("fullName email picture city country phone phoneNumber role bio lastSeen")
      .limit(30)
      .lean();

    const myCity = (req.user.city || "").trim().toLowerCase();
    const myCountry = (req.user.country || "").trim().toLowerCase();

    const results = matchedUsers.map((u) => {
      const uId = u._id.toString();
      const uPhone = u.phone || u.phoneNumber || "";
      const isFriend = acceptedFriendIds.has(uId);
      let connectionStatus = "none";
      let friendshipId = null;

      if (isFriend) {
        connectionStatus = "friends";
      } else if (pendingSentMap.has(uId)) {
        connectionStatus = "pending_sent";
        friendshipId = pendingSentMap.get(uId);
      } else if (pendingReceivedMap.has(uId)) {
        connectionStatus = "pending_received";
        friendshipId = pendingReceivedMap.get(uId);
      }

      // Reason matching
      let reason = "";
      if (query) {
        const escapedQ = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const searchRegex = new RegExp(escapedQ, "i");
        const rawDigits = query.replace(/\D/g, "");
        const cleanPhoneDigits = uPhone.replace(/\D/g, "");
        const phoneMatched =
          (rawDigits.length >= 3 && cleanPhoneDigits.includes(rawDigits)) ||
          (rawDigits.startsWith("0") && rawDigits.length >= 4 && cleanPhoneDigits.includes(rawDigits.slice(1))) ||
          (rawDigits.startsWith("92") && rawDigits.length >= 5 && cleanPhoneDigits.includes(rawDigits.slice(2))) ||
          searchRegex.test(uPhone);

        if (phoneMatched) {
          reason = `Matched by Phone (${uPhone})`;
        } else if (u.email && searchRegex.test(u.email)) {
          reason = `Matched by Email (${u.email})`;
        } else if (u.fullName && searchRegex.test(u.fullName)) {
          reason = `Matched by Full Name (${u.fullName})`;
        }
      }

      if (!reason) {
        const candCity = (u.city || "").trim().toLowerCase();
        const candCountry = (u.country || "").trim().toLowerCase();
        if (candCity && myCity && candCity === myCity) {
          reason =
            candCountry && myCountry && candCountry === myCountry
              ? `Same City & Country - ${u.city}, ${u.country}`
              : `Both from ${u.city}`;
        } else if (candCountry && myCountry && candCountry === myCountry) {
          reason = `Both from ${u.country}`;
        } else if (uPhone) {
          reason = `Phone Contact (${uPhone})`;
        } else {
          reason = "Member of Dar-ul-Ameen";
        }
      }

      return {
        user: {
          _id: u._id,
          fullName: u.fullName,
          email: u.email,
          picture: u.picture,
          city: u.city,
          country: u.country,
          phone: uPhone,
          role: Array.isArray(u.role) ? u.role[0] : u.role,
          lastSeen: u.lastSeen,
        },
        reason,
        connectionStatus,
        friendshipId,
        isFriend,
      };
    });

    return res.status(200).json({
      results,
      total: results.length,
      query,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to search people",
      error: error.message,
    });
  }
}

// GET /api/friends/requests - Get pending received and sent friend requests
async function getFriendRequests(req, res) {
  try {
    const myId = req.user._id;

    const received = await Friendship.find({
      recipient: myId,
      status: "pending",
    })
      .populate("requester", "fullName picture city country role lastSeen")
      .sort({ createdAt: -1 });

    const sent = await Friendship.find({
      requester: myId,
      status: "pending",
    })
      .populate("recipient", "fullName picture city country role lastSeen")
      .sort({ createdAt: -1 });

    return res.status(200).json({ received, sent });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to load friend requests", error: error.message });
  }
}

// POST /api/friends/request/:targetUserId - Send 1v1 Friend Request
async function sendFriendRequest(req, res) {
  try {
    const myId = req.user._id;
    const { targetUserId } = req.params;

    if (myId.toString() === targetUserId.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot send a friend request to yourself" });
    }

    const targetUser = await Auth.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    let friendship = await Friendship.findOne({
      $or: [
        { requester: myId, recipient: targetUserId },
        { requester: targetUserId, recipient: myId },
      ],
    });

    if (friendship) {
      if (friendship.status === "accepted") {
        return res.status(400).json({ message: "You are already friends" });
      }
      if (friendship.status === "blocked") {
        return res
          .status(403)
          .json({ message: "Cannot send friend request. User is blocked." });
      }
      if (friendship.status === "pending") {
        if (friendship.requester.toString() === myId.toString()) {
          return res
            .status(400)
            .json({ message: "Friend request already sent" });
        } else {
          // If the other user already sent a request, accept it automatically!
          friendship.status = "accepted";
          await friendship.save();

          const io = getIO();
          if (io) {
            io.to(`user_${targetUserId}`).emit("friendRequestAccepted", {
              byUser: req.user,
              friendship,
            });
          }

          return res.status(200).json({
            message: "Friend request accepted! You are now connected for 1v1 chat.",
            friendship,
            status: "accepted",
          });
        }
      }

      // If previously declined, renew to pending
      friendship.requester = myId;
      friendship.recipient = targetUserId;
      friendship.status = "pending";
      await friendship.save();
    } else {
      friendship = await Friendship.create({
        requester: myId,
        recipient: targetUserId,
        status: "pending",
      });
    }

    // Real-time notification via Socket.io
    const io = getIO();
    if (io) {
      io.to(`user_${targetUserId}`).emit("friendRequestReceived", {
        fromUser: {
          _id: req.user._id,
          fullName: req.user.fullName,
          picture: req.user.picture,
          city: req.user.city,
        },
        friendshipId: friendship._id,
      });
    }

    return res.status(201).json({
      message: "Friend request sent successfully",
      friendship,
      status: "pending",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to send friend request", error: error.message });
  }
}

// PUT /api/friends/accept/:friendshipId - Accept Friend Request (Unlocks 1v1 Chat)
async function acceptFriendRequest(req, res) {
  try {
    const myId = req.user._id;
    const { friendshipId } = req.params;

    const friendship = await Friendship.findById(friendshipId);
    if (!friendship) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    if (friendship.recipient.toString() !== myId.toString()) {
      return res
        .status(403)
        .json({ message: "Unauthorized: You are not the recipient of this request" });
    }

    friendship.status = "accepted";
    await friendship.save();

    // Notify requester in real-time
    const io = getIO();
    if (io) {
      io.to(`user_${friendship.requester}`).emit("friendRequestAccepted", {
        byUser: req.user,
        friendship,
      });
    }

    return res.status(200).json({
      message: "Friend request accepted! 1v1 Chat unlocked.",
      friendship,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to accept friend request", error: error.message });
  }
}

// PUT /api/friends/decline/:friendshipId - Decline Friend Request
async function declineFriendRequest(req, res) {
  try {
    const myId = req.user._id;
    const { friendshipId } = req.params;

    const friendship = await Friendship.findById(friendshipId);
    if (!friendship) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    if (friendship.recipient.toString() !== myId.toString()) {
      return res
        .status(403)
        .json({ message: "Unauthorized: You are not the recipient of this request" });
    }

    friendship.status = "declined";
    await friendship.save();

    return res.status(200).json({ message: "Friend request declined" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to decline friend request", error: error.message });
  }
}

module.exports = {
  getSuggestions,
  searchPeople,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
};
