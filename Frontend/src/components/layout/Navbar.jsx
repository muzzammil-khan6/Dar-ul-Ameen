import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  Globe,
  User,
  LogOut,
  RefreshCw,
  Menu,
  X,
  MessageSquare,
  Wallet,
} from "lucide-react";
import {
  logoutUser,
  logoutAllDevices,
  changeActiveRole,
} from "../../store/slices/authSlice";
import Button from "../common/Button";
import Logo from "../Logo";
import NotificationBell from "../common/NotificationBell";

const languages = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "ur", label: "اردو" },
  { code: "hi", label: "हिन्दी" },
];

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { user, activeRole } = useSelector((state) => state.auth || {});
  const storedAccessToken =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const storedRefreshToken =
    typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;
  const isAuthenticated = Boolean(
    user && (storedAccessToken || storedRefreshToken),
  );

  const studentWallet = useSelector((state) => state.student?.wallet);
  const teacherWallet = useSelector((state) => state.teacher?.wallet);
  const chats = useSelector((state) => state.chat?.chats);
  const totalUnread = Array.isArray(chats)
    ? chats.reduce((acc, c) => acc + (c?.unreadCount || 0), 0)
    : 0;

  const currentRole =
    activeRole || (Array.isArray(user?.role) ? user.role[0] : user?.role);
  const walletBalance =
    currentRole === "teacher"
      ? Number(teacherWallet?.balance) || 0
      : Number(studentWallet?.balance) || 0;
  const walletPath =
    currentRole === "teacher" ? "/teacher/wallet" : "/student/wallet";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    setUserDropdownOpen(false);
    navigate("/login");
  };

  const handleLogoutAll = async () => {
    await dispatch(logoutAllDevices());
    setUserDropdownOpen(false);
    navigate("/login");
  };

  const handleSwitchRole = async (targetRole) => {
    setUserDropdownOpen(false);
    const res = await dispatch(changeActiveRole(targetRole));
    if (res.meta.requestStatus === "fulfilled") {
      if (targetRole === "teacher") {
        navigate("/teacher/dashboard");
      } else {
        navigate("/student/dashboard");
      }
    }
  };

  // If current route is a portal route, the navbar appears exclusively as the sidebar!
  // It is NOT displayed in the header.
  const isPortalRoute =
    location.pathname.startsWith("/student") ||
    location.pathname.startsWith("/teacher") ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/chat");

  if (isAuthenticated && isPortalRoute) {
    return null;
  }

  // Navigation links for Home page sections
  const nav = [
    ["Programs", "programs"],
    ["How It Works", "how-it-works"],
    // ["Our Teachers", "teachers"],
    ["Our Vision", "vision"],
  ];

  const isHomePage = location.pathname === "/";

  const getDashboardPath = () => {
    if (!user) return "/";
    const role =
      activeRole || (Array.isArray(user.role) ? user.role[0] : user.role);
    if (role === "teacher") return "/teacher/dashboard";
    if (role === "admin") return "/admin/dashboard";
    return "/student/dashboard";
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-ivory border-b border-border shadow-xs">
      <div className="max-w-7xl  px-4 sm:px-6">
        {/* TOP AREA */}
        <div className="flex items-center justify-between h-16">
          {/* LEFT AREA: Dropdown Button + Logo  */}
          <div className="flex items-center gap-4 lg:gap-6">
            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-charcoal hover:bg-sage/50"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
            {/* Brand Logo - directs to home */}
            <Link to="/" className="flex items-center shrink-0">
              <div className="overflow-hiddenitems-center mb-3">
                <Logo variant="full" className="h-16 mt-4 w-28" />
              </div>
            </Link>


            <nav className="hidden md:flex items-center gap-6">
              {isHomePage ? (
                nav.map(([label, id]) => (
                  <a
                    key={id}
                    href={"#" + id}
                    className="text-sm font-medium text-charcoal/80 hover:text-primary transition-colors"
                  >
                    {label}
                  </a>
                ))
              ) : (
                <Link
                  to="/"
                  className="text-sm font-medium text-charcoal/80 hover:text-primary transition-colors"
                >
                  Home
                </Link>
              )}
            </nav>
          </div>

          {/* RIGHT AREA: Language Switcher + User Area */}
          <div className="flex items-center gap-3">
                        {/* Desktop Navigation Links */}
            {isHomePage && (
              <Link to="/teachers">
                <Button variant="cta" size="sm">
                  Book an Introductory Class
                </Button>
              </Link>
            )}
            {/* Language Switcher: English | العربية | اردو | हिन्दी */}
            <div className="hidden lg:flex items-center text-xs font-medium border border-border rounded-lg p-1 bg-sage/40">
              {languages.map((l, idx) => (
                <React.Fragment key={l.code}>
                  <button
                    type="button"
                    onClick={() => handleLanguageChange(l.code)}
                    className={`px-2 py-1 rounded transition-colors ${
                      i18n.language === l.code
                        ? "bg-white text-primary font-semibold shadow-2xs"
                        : "text-muted hover:text-charcoal"
                    }`}
                  >
                    {l.label}
                  </button>
                  {idx < languages.length - 1 && (
                    <span className="text-border px-0.5">|</span>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Auth Buttons or User Menu */}
            {!isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="secondary" size="sm">
                    {t("nav.login") || "Log In"}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Wallet Balance Pill */}
                {currentRole !== "admin" && (
                  <Link to={walletPath}>
                    <button
                      type="button"
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sage/60 hover:bg-sage text-primary border border-border text-xs font-bold transition-colors cursor-pointer"
                      title="Wallet Balance"
                    >
                      <Wallet className="w-3.5 h-3.5 text-primary" />
                      <span>Rs. {walletBalance.toLocaleString()}</span>
                    </button>
                  </Link>
                )}

                {/* Notification Bell */}
                <NotificationBell />

                {/* 1v1 Chat / Messages Icon */}
                <Link
                  to="/chat"
                  className="relative p-2 text-muted hover:text-charcoal hover:bg-sage/40 rounded-lg transition-colors"
                  title="1v1 Chat / Messenger"
                >
                  <MessageSquare className="w-5 h-5 text-charcoal" />
                  {totalUnread > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                      {totalUnread > 9 ? "9+" : totalUnread}
                    </span>
                  )}
                </Link>

                <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-sage/40 transition-colors border border-border cursor-pointer bg-white"
                >
                  <img
                    src={
                      user.picture ||
                      "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"
                    }
                    alt={user.fullName}
                    className="w-7 h-7 rounded-full object-cover border border-border"
                  />
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-semibold text-charcoal leading-tight max-w-[120px] truncate">
                      {user.fullName}
                    </span>
                    <span className="text-[10px] text-primary font-medium capitalize">
                      {activeRole || user.role?.[0]}
                    </span>
                  </div>
                </button>

                {/* User Dropdown */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-border rounded-xl shadow-lg py-1.5 z-50">
                    <div className="px-4 py-2 border-b border-border/50">
                      <p className="text-xs font-semibold text-charcoal truncate">
                        {user.fullName}
                      </p>
                      <p className="text-[11px] text-muted truncate">
                        {user.email}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold bg-sage text-primary rounded">
                        Role: {activeRole || user.role?.[0]}
                      </span>
                    </div>

                    {/* Profile link */}
                    <Link
                      to={
                        activeRole === "teacher"
                          ? "/teacher/profile"
                          : activeRole === "student"
                          ? "/student/profile"
                          : "/admin/dashboard"
                      }
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-charcoal hover:bg-sage/40 transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-muted" />
                      <span>{t("nav.profile")}</span>
                    </Link>

                    {/* 1v1 Chat / Messages Link */}
                    <Link
                      to="/chat"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-charcoal hover:bg-sage/40 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-primary" />
                      <span>1v1 Chat & Messages</span>
                      {totalUnread > 0 && (
                        <span className="ml-auto px-1.5 py-0.5 bg-primary text-white rounded-full text-[10px] font-bold">
                          {totalUnread}
                        </span>
                      )}
                    </Link>

                    {/* Role Switcher (Admin cannot change role per spec) */}
                    {activeRole !== "admin" && (
                      <button
                        type="button"
                        onClick={() =>
                          handleSwitchRole(
                            activeRole === "student" ? "teacher" : "student",
                          )
                        }
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-primary hover:bg-sage/40 transition-colors cursor-pointer text-left"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>
                          {t("nav.changeRole")}{" "}
                          {activeRole === "student"
                            ? t("nav.teacher")
                            : t("nav.student")}
                        </span>
                      </button>
                    )}

                    <div className="border-t border-border/50 my-1" />

                    {/* Logout */}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-charcoal hover:bg-sage/40 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-3.5 h-3.5 text-muted" />
                      <span>{t("nav.logout")}</span>
                    </button>

                    {/* Logout all devices */}
                    <button
                      type="button"
                      onClick={handleLogoutAll}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      <span>{t("nav.logoutAll")}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          </div>
        </div>
        {/* BOTTOM AREA: Dropdown */}
        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border py-3 space-y-2 bg-ivory">
            {/* Language Switcher in Mobile */}
            <div className="flex items-center justify-around py-2 border-b border-border/50">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => handleLanguageChange(l.code)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    i18n.language === l.code
                      ? "bg-primary text-white font-semibold"
                      : "text-muted hover:text-charcoal"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {isHomePage ? (
              nav.map(([label, id]) => (
                <a
                  key={id}
                  href={"#" + id}
                  onClick={() => setMobileMenuOpen(false)}
                  className="md:hidden block px-3 py-2 rounded-lg text-sm font-medium text-charcoal hover:bg-sage/40 hover:text-primary transition-colors"
                >
                  {label}
                </a>
              ))
            ) : (
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="md:hidden block px-3 py-2 rounded-lg text-sm font-medium text-charcoal hover:bg-sage/40 hover:text-primary transition-colors"
              >
                Home
              </Link>
            )}

            {/* {!isAuthenticated && (
              <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="secondary" className="w-full">
                    {t("nav.login") || "Log In"}
                  </Button>
                </Link>
                <Link to="/teachers" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="cta" className="w-full">
                    Book an Introductory Class
                  </Button>
                </Link>
              </div>
            )} */}
          </div>
        )}
      </div>
    </header>
  );
}
