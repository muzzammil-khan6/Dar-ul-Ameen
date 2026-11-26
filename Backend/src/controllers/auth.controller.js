const { google } = require("googleapis");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//Local Models
const authModel = require("../models/auth.model");
const sessionModel = require("../models/sessions.model");
const sendWelcomeEmail = require("../services/email.service");

const getOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
};

// 1. google - Start Google login
async function googleLogin(req, res) {
  try {
    const role = req.query.role || "student";

    const scopes = [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/calendar.events",
    ];

    const client = getOAuth2Client();
    const url = client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: scopes,
      state: role,
    });

    res.redirect(url);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// 2. googleCallback - Handle user after Google login
async function googleCallback(req, res) {
  try {
    const { code, state } = req.query;
    const role = state || "student";

    if (!code) {
      return res
        .status(400)
        .json({ message: "Authorization code missing from Google" });
    }

    const client = getOAuth2Client();
    const { tokens } = await client.getToken(code);

    client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: client });
    const { data } = await oauth2.userinfo.get();

    const tempToken = jwt.sign(
      {
        email: data.email,
        name: data.name,
        picture: data.picture,
        role: role,
        googleRefreshToken: tokens.refresh_token || "",
        google_access_token: tokens.access_token,
      },
      process.env.JWT_SECRET,
      { expiresIn: "10m" },
    );

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    // If opened in browser directly, redirect to frontend callback
    if (req.headers.accept && req.headers.accept.includes("text/html")) {
      return res.redirect(
        `${frontendUrl}/google-callback?tempToken=${encodeURIComponent(
          tempToken,
        )}&email=${encodeURIComponent(data.email || "")}&name=${encodeURIComponent(
          data.name || "",
        )}&picture=${encodeURIComponent(data.picture || "")}`,
      );
    }

    return res.status(200).json({ role, data, tokens, tempToken });
  } catch (error) {
    console.error("Google Callback Error Details:", error);
    return res.status(500).json({
      message: "Google Callback Error",
      error: error.message,
    });
  }
}

// 3. register - Register new user
async function registerController(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      tempToken,
      fullName,
      email,
      password,
      phone,
      phoneNumber,
      city,
      country,
      preferredLanguage,
      role,
      ref,
      referralCode,
    } = req.body;

    let userEmail = email;
    let userPicture =
      "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";
    let googleRefreshToken = null;

    if (tempToken) {
      try {
        const googleData = jwt.verify(tempToken, process.env.JWT_SECRET);
        userEmail = googleData.email;
        if (googleData.picture) userPicture = googleData.picture;
        if (googleData.googleRefreshToken)
          googleRefreshToken = googleData.googleRefreshToken;
      } catch (err) {
        return res
          .status(400)
          .json({ message: "Invalid or expired Google token" });
      }
    }

    if (!userEmail) {
      return res.status(400).json({ message: "Email address is required" });
    }

    const normalizedEmail = userEmail.toLowerCase().trim();
    const isUserExist = await authModel.findOne({ email: normalizedEmail });
    if (isUserExist) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const assignedRole =
      role && ["teacher", "student"].includes(role.toLowerCase())
        ? role.toLowerCase()
        : "student";
    const userPhone = phone || phoneNumber || "";

    // Generate unique referral code for the new user
    const cleanName = (fullName || "USER")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 4)
      .toUpperCase();
    const generatedReferralCode = `REF_${cleanName}_${Math.floor(1000 + Math.random() * 9000)}`;

    // Check referral link
    let inviterUser = null;
    const incomingRef = (ref || referralCode || req.query.ref || "")
      .toString()
      .trim()
      .toUpperCase();
    if (incomingRef) {
      inviterUser = await authModel.findOne({ referralCode: incomingRef });
    }

    const user = await authModel.create({
      fullName,
      email: normalizedEmail,
      password: hashPassword,
      phone: userPhone,
      phoneNumber: userPhone,
      city: city || "",
      country: country || "",
      preferredLanguage: preferredLanguage || "English",
      picture: userPicture,
      role: [assignedRole],
      teachingStatus: assignedRole === "teacher" ? "pending" : "approved",
      googleRefreshToken,
      isGoogleVerified: Boolean(tempToken),
      referralCode: generatedReferralCode,
      referredBy: inviterUser ? inviterUser._id : null,
    });

    // If registered via referral, update invite record and auto-establish 1v1 friendship
    if (inviterUser) {
      try {
        const inviteModel = require("../models/invite.model");
        const friendshipModel = require("../models/friendship.model");

        let inviteDoc = await inviteModel.findOne({
          inviter: inviterUser._id,
          $or: [
            { invitedEmail: normalizedEmail },
            { inviteCode: incomingRef },
          ],
        });

        if (inviteDoc) {
          inviteDoc.status = "joined";
          inviteDoc.joinedUser = user._id;
          inviteDoc.joinedAt = new Date();
          await inviteDoc.save();
        } else {
          await inviteModel.create({
            inviter: inviterUser._id,
            invitedEmail: normalizedEmail,
            invitedName: fullName,
            inviteCode: incomingRef,
            status: "joined",
            joinedUser: user._id,
            joinedAt: new Date(),
          });
        }

        // Auto-connect for 1v1 chat
        await friendshipModel.findOneAndUpdate(
          {
            $or: [
              { requester: inviterUser._id, recipient: user._id },
              { requester: user._id, recipient: inviterUser._id },
            ],
          },
          {
            requester: inviterUser._id,
            recipient: user._id,
            status: "accepted",
          },
          { upsert: true, new: true },
        );

        // Real-time socket notification to inviter if online
        const { getIO } = require("../services/socket.service");
        const io = getIO();
        if (io) {
          io.to(`user_${inviterUser._id}`).emit("notification", {
            type: "friend_joined",
            title: "Your Friend Joined!",
            message: `Your friend ${user.fullName} joined using your invite link!`,
            joinedUser: {
              id: user._id,
              fullName: user.fullName,
              picture: user.picture,
            },
          });
        }
      } catch (refErr) {
        console.error("Error processing referral on register:", refErr.message);
      }
    }

    if (assignedRole === "teacher") {
      return res.status(201).json({
        message: "Teaching request succesfully send.",
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          city: user.city,
          country: user.country,
          preferredLanguage: user.preferredLanguage,
          picture: user.picture,
          role: assignedRole,
          teachingStatus: user.teachingStatus,
        },
      });
    }

    // create session and generate tokens for student
    const refreshToken = jwt.sign({ Id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const session = await sessionModel.create({
      userID: user._id,
      refreshTokenHash: refreshTokenHash,
      ip: req.ip || "127.0.0.1",
      userAgent: req.headers["user-agent"] || "unknown",
      activeRole: assignedRole,
    });

    const accessToken = jwt.sign(
      {
        Id: user._id,
        sessionId: session._id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    try {
      sendWelcomeEmail(user.email, user.fullName);
    } catch (e) {
      console.error("Email sending failed:", e.message);
    }

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        city: user.city,
        country: user.country,
        preferredLanguage: user.preferredLanguage,
        picture: user.picture,
        role: session.activeRole,
      },
      session,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Registration failed", error: error.message });
  }
}

// 4. login - Login with Email / Password
async function loginController(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await authModel
      .findOne({ email: email.toLowerCase().trim() })
      .select("+password");

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (user.isBlocked) {
      return res
        .status(403)
        .json({ message: "Your account has been blocked by Admin." });
    }

    let activeRole = user.role.includes("admin")
      ? "admin"
      : user.role.includes("teacher")
      ? "teacher"
      : "student";

    let rejectionNotice = null;
    if (user.role.includes("teacher") && user.teachingStatus === "rejected") {
      rejectionNotice =
        "Your application for the teaching role has been rejected by the admin. You can only use student features.";
      if (activeRole === "teacher" && user.role.includes("student")) {
        activeRole = "student";
      }
    }

    const session = await sessionModel.create({
      userID: user._id,
      refreshTokenHash: "pending",
      ip: req.ip || "127.0.0.1",
      userAgent: req.headers["user-agent"] || "unknown",
      activeRole,
    });

    const refreshToken = jwt.sign(
      { Id: user._id, sessionId: session._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    session.refreshTokenHash = refreshTokenHash;
    await session.save();

    const accessToken = jwt.sign(
      {
        Id: user._id,
        sessionId: session._id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    if (!user.referralCode) {
      const cleanName = (user.fullName || "USER")
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 4)
        .toUpperCase();
      user.referralCode = `REF_${cleanName}_${Math.floor(1000 + Math.random() * 9000)}`;
      await user.save();
    }

    res.status(200).json({
      message: "User successfully Login",
      rejectionNotice,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone || user.phoneNumber || "",
        city: user.city || "",
        country: user.country || "",
        preferredLanguage: user.preferredLanguage || "English",
        bio: user.bio || "",
        picture: user.picture,
        role: session.activeRole,
        roles: user.role,
        teachingStatus: user.teachingStatus,
        isBlocked: user.isBlocked,
        studentWallet: user.studentWallet || 0,
        referralCode: user.referralCode,
      },
      session,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
}

// 5. logout - Logout from one device
async function logoutController(req, res) {
  try {
    const user = req.user;

    const logoutQuery = {
      userID: user._id,
      revoked: false,
    };
    if (req.session?._id) {
      logoutQuery._id = req.session._id;
    } else {
      logoutQuery.ip = req.ip;
      logoutQuery.userAgent = req.headers["user-agent"];
    }

    await sessionModel.findOneAndUpdate(
      logoutQuery,
      {
        revoked: true,
      },
    );

    res.clearCookie("refreshToken");
    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Logout failed", error: error.message });
  }
}

// 6. logoutAll - Logout from all devices
async function logoutAllController(req, res) {
  try {
    const user = req.user;

    await sessionModel.updateMany(
      {
        userID: user._id,
        revoked: false,
      },
      { revoked: true },
    );

    res.clearCookie("refreshToken");

    res
      .status(200)
      .json({ message: "User logged out from all sessions successfully" });
  } catch (error) {
    res.status(500).json({ message: "Logout failed", error: error.message });
  }
}

// 7. refreshToken - Generate new token when token expires
async function refreshTokenController(req, res) {
  try {
    const refreshToken =
      req.cookies?.refreshToken ||
      req.body?.refreshToken ||
      req.headers.authorization?.split(" ")[1];
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token not found" });
    }
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    const sessionQuery = {
      userID: decoded.Id,
      revoked: false,
    };
    if (decoded.sessionId) {
      sessionQuery._id = decoded.sessionId;
    }

    let session = await sessionModel.findOne(sessionQuery);
    if (!session && decoded.sessionId) {
      session = await sessionModel.findOne({
        userID: decoded.Id,
        revoked: false,
      });
    }

    if (!session) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const accessToken = jwt.sign(
      {
        Id: decoded.Id,
        sessionId: session._id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    const newRefreshToken = jwt.sign(
      { Id: decoded.Id, sessionId: session._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );
    const refreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    session.refreshTokenHash = refreshTokenHash;
    await session.save();

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Access token refreshed successfully",
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    const isTokenError =
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError";
    res.status(isTokenError ? 401 : 500).json({
      message: isTokenError
        ? "Invalid or expired refresh token"
        : "Token refreshing failed",
      error: error.message,
    });
  }
}

// 8. myProfile - Get my profile
async function myProfileController(req, res) {
  try {
    const user = req.user;

    res.status(200).json({
      message: "Profile Successfully fetched",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone || user.phoneNumber || "",
        city: user.city || "",
        country: user.country || "",
        preferredLanguage: user.preferredLanguage || "English",
        bio: user.bio || "",
        picture: user.picture,
        role: req.session ? req.session.activeRole : user.role[0],
        roles: user.role,
        teachingStatus: user.teachingStatus,
        isBlocked: user.isBlocked,
        studentWallet: user.studentWallet || 0,
        referralCode: user.referralCode,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Profile fetching error", error: error.message });
  }
}

// 9. updateProfile - Update profile (bio, photo, etc.)
async function updateProfileController(req, res) {
  try {
    const user = await authModel.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User account not found" });
    }

    const {
      fullName,
      phone,
      phoneNumber,
      city,
      country,
      preferredLanguage,
      bio,
      picture,
      previousPassword,
      newPassword,
    } = req.body;

    if (previousPassword || newPassword) {
      if (!previousPassword || !newPassword) {
        return res.status(400).json({
          message:
            "Both previous and new passwords are required to change password",
        });
      }

      const isMatch = await bcrypt.compare(previousPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid previous password" });
      }

      user.password = await bcrypt.hash(newPassword, 10);
    }

    if (fullName) user.fullName = fullName;
    if (phone || phoneNumber) {
      user.phone = phone || phoneNumber;
      user.phoneNumber = phone || phoneNumber;
    }
    if (city !== undefined) user.city = city;
    if (country !== undefined) user.country = country;
    if (preferredLanguage) user.preferredLanguage = preferredLanguage;
    if (bio !== undefined) user.bio = bio;
    if (picture) user.picture = picture;

    await user.save();

    res.status(200).json({
      message: "Profile Successfully updated",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        city: user.city,
        country: user.country,
        preferredLanguage: user.preferredLanguage,
        bio: user.bio,
        picture: user.picture,
        role: req.session ? req.session.activeRole : user.role[0],
        roles: user.role,
        teachingStatus: user.teachingStatus,
        isBlocked: user.isBlocked,
        studentWallet: user.studentWallet || 0,
        referralCode: user.referralCode,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Profile update error", error: error.message });
  }
}

// 10. addRole - Add role for the first time
async function addRoleController(req, res) {
  try {
    const user = req.user;
    const role = req.query.role || req.body.role;
    if (!["student", "teacher"].includes(role)) {
      return res.status(400).json({ message: "Role missing or invalid" });
    }

    if (user.role.includes(role)) {
      return res.status(400).json({ message: "This role already exists" });
    }

    if (role === "teacher") {
      user.role.push(role);
      user.teachingStatus = "pending";
      await user.save();

      return res.status(201).json({
        message: "Teacher role request succesfully send",
        role,
      });
    }

    user.role.push(role);
    await user.save();

    await sessionModel.findOneAndUpdate(
      {
        userID: user._id,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      },
      { activeRole: role },
    );

    res.status(201).json({
      message: "New role succesfully added",
      role,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Role adding failed", error: error.message });
  }
}

// 11. changeRole - Change role later (Student <-> Teacher). Admin role cannot be changed. After changeRole, generate a new token.
async function changeActiveRoleController(req, res) {
  try {
    const user = req.user;
    const targetRole = req.query.role || req.body.role;

    if (!["student", "teacher"].includes(targetRole)) {
      return res.status(400).json({ message: "Role missing or invalid" });
    }

    if (user.role.includes("admin") || targetRole === "admin") {
      return res.status(403).json({ message: "Admin role cannot be changed" });
    }

    // If user does not have this role yet, add it
    if (!user.role.includes(targetRole)) {
      user.role.push(targetRole);
      if (targetRole === "teacher") {
        user.teachingStatus = "pending";
      }
      await user.save();
    }

    let rejectionNotice = null;
    if (targetRole === "teacher" && user.teachingStatus === "rejected") {
      return res.status(403).json({
        message:
          "Your application for the teaching role has been rejected by the admin. You can only use student features.",
      });
    }

    const sessionQuery = {
      userID: user._id,
      revoked: false,
    };
    if (req.session?._id) {
      sessionQuery._id = req.session._id;
    }

    let session = await sessionModel.findOneAndUpdate(
      sessionQuery,
      { activeRole: targetRole },
      { new: true },
    );

    if (!session) {
      session = await sessionModel.create({
        userID: user._id,
        refreshTokenHash: "placeholder",
        ip: req.ip || "127.0.0.1",
        userAgent: req.headers["user-agent"] || "unknown",
        activeRole: targetRole,
      });
    }

    const accessToken = jwt.sign(
      {
        Id: user._id,
        sessionId: session._id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    res.status(200).json({
      message: "Role successfully changed",
      rejectionNotice,
      accessToken,
      session,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone || user.phoneNumber || "",
        city: user.city || "",
        country: user.country || "",
        preferredLanguage: user.preferredLanguage || "English",
        bio: user.bio || "",
        picture: user.picture,
        role: targetRole,
        roles: user.role,
        teachingStatus: user.teachingStatus,
        isBlocked: user.isBlocked,
        studentWallet: user.studentWallet || 0,
        referralCode: user.referralCode,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Role changing failed", error: error.message });
  }
}

module.exports = {
  // Original names
  googleLogin,
  googleCallback,
  registerController,
  loginController,
  logoutController,
  logoutAllController,
  refreshTokenController,
  myProfileController,
  updateProfileController,
  addRoleController,
  changeActiveRoleController,

  // Aliases for 11 controllers as listed in prompt
  google: googleLogin,
  register: registerController,
  login: loginController,
  logout: logoutController,
  logoutAll: logoutAllController,
  refreshToken: refreshTokenController,
  myProfile: myProfileController,
  updateProfile: updateProfileController,
  addRole: addRoleController,
  changeRole: changeActiveRoleController,
};
