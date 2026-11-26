const Invite = require("../models/invite.model");
const Auth = require("../models/auth.model");
const { sendInvitationEmail } = require("../services/email.service");

// Helper to ensure user has a referralCode
async function ensureReferralCode(user) {
  if (user.referralCode) return user.referralCode;
  const cleanName = (user.fullName || "USER")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 4)
    .toUpperCase();
  const code = `REF_${cleanName}_${user._id.toString().slice(-4)}`.toUpperCase();
  user.referralCode = code;
  await user.save();
  return code;
}

// GET /api/invites - Get current user's invite summary and list
async function getInviteSummary(req, res) {
  try {
    const user = req.user;
    const referralCode = await ensureReferralCode(user);
    const frontendUrl =
      process.env.FRONTEND_URL || "http://localhost:5173";
    const inviteLink = `${frontendUrl}/register?ref=${referralCode}`;

    const invites = await Invite.find({ inviter: user._id })
      .populate("joinedUser", "fullName picture email")
      .sort({ createdAt: -1 });

    const totalInvited = invites.length;
    const totalJoined = invites.filter(
      (i) => i.status === "joined" || i.status === "rewarded",
    ).length;
    const totalRewarded = invites.filter((i) => i.status === "rewarded").length;
    const totalEarned = totalRewarded * 100;

    const whatsappShareText = `Hey! Join me on Dar-ul-Ameen for 1v1 Classes. Sign up here: ${inviteLink}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappShareText)}`;

    return res.status(200).json({
      inviteCode: referralCode,
      inviteLink,
      whatsappUrl,
      whatsappShareText,
      stats: {
        totalInvited,
        totalJoined,
        totalRewarded,
        totalEarned,
      },
      invites,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to load invite summary", error: error.message });
  }
}

// POST /api/invites/email - Send invite via Email
async function sendEmailInvite(req, res) {
  try {
    const user = req.user;
    const { email, name } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === user.email.toLowerCase()) {
      return res
        .status(400)
        .json({ message: "You cannot invite yourself" });
    }

    // Check if this person is already registered
    const existingUser = await Auth.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        message: "This email is already registered on Dar-ul-Ameen.",
      });
    }

    const referralCode = await ensureReferralCode(user);
    const frontendUrl =
      process.env.FRONTEND_URL || "http://localhost:5173";
    const inviteLink = `${frontendUrl}/register?ref=${referralCode}`;

    // Create or update invite record
    let invite = await Invite.findOne({
      inviter: user._id,
      invitedEmail: cleanEmail,
    });

    if (!invite) {
      invite = await Invite.create({
        inviter: user._id,
        invitedEmail: cleanEmail,
        invitedName: name ? name.trim() : null,
        inviteCode: referralCode,
        inviteLink,
        status: "pending",
      });
    }

    // Send email using email service
    await sendInvitationEmail(cleanEmail, user.fullName, inviteLink);

    return res.status(200).json({
      message: `Invitation email sent to ${cleanEmail}`,
      invite,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to send invitation email", error: error.message });
  }
}

// POST /api/invites/phone - Generate phone / manual invite
async function createPhoneInvite(req, res) {
  try {
    const user = req.user;
    const { phone, name } = req.body;

    if (!phone || !phone.trim()) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const cleanPhone = phone.trim();
    const referralCode = await ensureReferralCode(user);
    const frontendUrl =
      process.env.FRONTEND_URL || "http://localhost:5173";
    const inviteLink = `${frontendUrl}/register?ref=${referralCode}`;

    let invite = await Invite.findOne({
      inviter: user._id,
      invitedPhone: cleanPhone,
    });

    if (!invite) {
      invite = await Invite.create({
        inviter: user._id,
        invitedPhone: cleanPhone,
        invitedName: name ? name.trim() : null,
        inviteCode: referralCode,
        inviteLink,
        status: "pending",
      });
    }

    const shareText = `Hey ${name ? name.trim() : "there"}! Join me on Dar-ul-Ameen for 1v1 Classes. Sign up here: ${inviteLink}`;
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${encodeURIComponent(cleanPhone)}&text=${encodeURIComponent(shareText)}`;

    return res.status(200).json({
      message: "Phone invite generated successfully",
      inviteLink,
      shareText,
      whatsappUrl,
      invite,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to create phone invite", error: error.message });
  }
}

// GET /api/invites/ref/:refCode - Validate referral code (Public)
async function validateReferral(req, res) {
  try {
    const { refCode } = req.params;
    if (!refCode) {
      return res.status(400).json({ valid: false });
    }

    const inviter = await Auth.findOne({
      $or: [
        { referralCode: refCode.toUpperCase() },
        { _id: refCode.match(/^[0-9a-fA-F]{24}$/) ? refCode : null },
      ],
      isBlocked: { $ne: true },
    }).select("fullName picture role city country");

    if (!inviter) {
      return res.status(404).json({ valid: false, message: "Invalid invite code" });
    }

    return res.status(200).json({
      valid: true,
      inviter: {
        _id: inviter._id,
        fullName: inviter.fullName,
        picture: inviter.picture,
      },
    });
  } catch (error) {
    return res.status(500).json({ valid: false, error: error.message });
  }
}

module.exports = {
  getInviteSummary,
  sendEmailInvite,
  createPhoneInvite,
  validateReferral,
};
