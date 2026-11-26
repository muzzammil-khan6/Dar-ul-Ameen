const teacherApprovalMiddleware = (req, res, next) => {
  try {
    const session = req.session;
    const user = req.user;

    if (!session || session.activeRole !== "teacher") {
      return res
        .status(403)
        .json({ message: "Access denied: Teacher role required" });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        status: "BLOCKED",
        message: "Your account has been blocked by Admin.",
      });
    }

    if (user.teachingStatus === "pending") {
      return res.status(403).json({
        status: "PENDING_APPROVAL",
        message:
          "Your profile is under review. Admin has not approved you yet. You will get access after approval.",
      });
    }

    if (user.teachingStatus === "rejected") {
      return res.status(403).json({
        status: "REJECTED",
        message: "Your teaching request was rejected. Access denied.",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid role or unauthorized",
      error: error.message,
    });
  }
};

module.exports = teacherApprovalMiddleware;
