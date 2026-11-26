const jwt = require("jsonwebtoken");
const authModel = require("../models/auth.model");
const sessionsModel = require("../models/sessions.model");

const handleAuth = async (allowedRoles, req, res, next) => {
  try {
    const accessToken =
      req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];
    if (!accessToken) {
      return res.status(401).json({ message: "Access token not found" });
    }

    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);

    const query = {
      userID: decoded.Id,
      revoked: false,
    };

    if (decoded.sessionId) {
      query._id = decoded.sessionId;
    }

    if (allowedRoles && allowedRoles.length > 0) {
      query.activeRole = { $in: allowedRoles };
    }

    let session = await sessionsModel.findOne(query);

    // Fallback if session by decoded.sessionId was not found (e.g. legacy token)
    if (!session && decoded.sessionId) {
      const fallbackQuery = {
        userID: decoded.Id,
        revoked: false,
      };
      if (allowedRoles && allowedRoles.length > 0) {
        fallbackQuery.activeRole = { $in: allowedRoles };
      }
      session = await sessionsModel.findOne(fallbackQuery);
    }

    if (!session) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Active role or session not found" });
    }

    const user = await authModel.findById(decoded.Id);
    if (!user) {
      return res.status(401).json({ message: "User account not found" });
    }

    if (user.isBlocked) {
      return res
        .status(403)
        .json({ message: "Your account has been blocked by Admin." });
    }

    req.user = user;
    req.session = session;

    // Update session activity timestamp (throttled to once every 60s per session)
    if (
      session &&
      (!session.updatedAt ||
        Date.now() - new Date(session.updatedAt).getTime() > 60000)
    ) {
      sessionsModel
        .updateOne({ _id: session._id }, { $set: { updatedAt: new Date() } })
        .exec()
        .catch(() => {});
    }

    return next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid token or role unauthorized",
      error: error.message,
    });
  }
};

const authMiddleware = (...args) => {
  // If Express passes (req, res, next) directly:
  if (
    args.length >= 2 &&
    args[0] &&
    typeof args[0] === "object" &&
    typeof args[args.length - 1] === "function"
  ) {
    const req = args[0];
    const res = args[1];
    const next = args[args.length - 1];
    return handleAuth([], req, res, next);
  }

  // Otherwise invoked as a factory: authMiddleware("admin") or authMiddleware()
  const allowedRoles = args.filter((a) => typeof a === "string");
  return (req, res, next) => handleAuth(allowedRoles, req, res, next);
};

const optionalAuth = async (req, res, next) => {
  try {
    const accessToken =
      req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];
    if (!accessToken) {
      return next();
    }

    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    if (!decoded || !decoded.Id) {
      return next();
    }

    const user = await authModel.findById(decoded.Id);
    if (user && !user.isBlocked) {
      req.user = user;
    }
    return next();
  } catch (err) {
    return next();
  }
};

authMiddleware.optional = optionalAuth;

module.exports = authMiddleware;
