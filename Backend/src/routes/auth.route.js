const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const jwt = require("jsonwebtoken");

//Local Modules
const authControllers = require("../controllers/auth.controller");
const adminControllers = require("../controllers/admin.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// ==========================================
// PUBLIC / OAUTH ROUTES
// ==========================================
router.get("/google", authControllers.googleLogin);
router.get("/google/callback", authControllers.googleCallback);

// Dev / Testing Helper: Simulate Google Login without live OAuth credentials
router.get("/google/mock", (req, res) => {
  const role = req.query.role || "student";
  const email = req.query.email || `google.user.${Date.now().toString().slice(-4)}@gmail.com`;
  const name = req.query.name || "Google Verified User";
  const picture = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop&crop=face";
  const tempToken = jwt.sign(
    {
      email,
      name,
      picture,
      role,
      googleRefreshToken: "mock_refresh_token",
      google_access_token: "mock_access_token",
    },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  return res.redirect(
    `${frontendUrl}/google-callback?tempToken=${encodeURIComponent(tempToken)}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&picture=${encodeURIComponent(picture)}`
  );
});

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================
router.post(
  "/register",
  body("fullName")
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 3 })
    .withMessage("Full name must be at least 3 characters long"),
  body("password")
    .notEmpty()
    .trim()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("city").notEmpty().withMessage("City is required"),
  body("country").notEmpty().withMessage("Country is required"),
  authControllers.registerController,
);

router.post(
  "/login",
  body("email")
    .notEmpty()
    .trim()
    .isEmail()
    .withMessage("Email is invalid")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .trim()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  authControllers.loginController,
);

router.all("/refresh-token", authControllers.refreshTokenController);
router.post("/refreshToken", authControllers.refreshTokenController);

// ==========================================
// SECURE ROUTES (Requires Authentication)
// ==========================================
router.get(
  "/requests",
  authMiddleware("admin"),
  adminControllers.requestsController,
);

router.all(
  "/logout",
  authMiddleware("teacher", "student", "admin"),
  authControllers.logoutController,
);

router.all(
  "/logout-all",
  authMiddleware("teacher", "student", "admin"),
  authControllers.logoutAllController,
);
router.post(
  "/logoutAll",
  authMiddleware("teacher", "student", "admin"),
  authControllers.logoutAllController,
);

router.get(
  "/my-profile",
  authMiddleware("teacher", "student", "admin"),
  authControllers.myProfileController,
);
router.get(
  "/myProfile",
  authMiddleware("teacher", "student", "admin"),
  authControllers.myProfileController,
);

router.post(
  "/update-profile",
  authMiddleware("teacher", "student", "admin"),
  authControllers.updateProfileController,
);
router.put(
  "/profile",
  authMiddleware("teacher", "student", "admin"),
  authControllers.updateProfileController,
);

router.all(
  "/add-role",
  authMiddleware("teacher", "student", "admin"),
  authControllers.addRoleController,
);

router.all(
  "/change-active-role",
  authMiddleware("teacher", "student", "admin"),
  authControllers.changeActiveRoleController,
);
router.put(
  "/change-role",
  authMiddleware("teacher", "student", "admin"),
  authControllers.changeActiveRoleController,
);

module.exports = router;
