// Job: Top dashboard header organism with user profile, wallet balance, notification bell, and role switching
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import Logo from "../Logo";
import Avatar from "../atoms/Avatar";
import PriceText from "../atoms/PriceText";
import IconButton from "../atoms/IconButton";
import {
  logoutUser,
  logoutAllDevices,
  changeActiveRole,
} from "../../store/slices/authSlice";
import {
  LogOut,
  RefreshCw,
  Menu,
  MessageSquare,
  Wallet,
  RefreshCw,
  Check,
} from "lucide-react";
import NotificationBell from "../common/NotificationBell";

const languages = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "ur", label: "اردو" },
  { code: "hi", label: "हिन्दी" },
];

export default function Header({
  onToggleSidebar,
  role = "student",
  className = "",
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, activeRole } = useSelector((state) => state.auth || {});
  const studentWallet = useSelector((state) => state.student?.wallet);
  const teacherWallet = useSelector((state) => state.teacher?.dashboard?.wallet);

  const chats = useSelector((state) => state.chat?.chats);
  const totalUnread = Array.isArray(chats)
    ? chats.reduce((acc, c) => acc + (c?.unreadCount || 0), 0)
    : 0;
  const balance =
    role === "teacher"
      ? teacherWallet?.balance || 0
      : studentWallet?.balance || 0;

  const [profileOpen, setProfileOpen] = useState(false);
  const profileDropdownRef = useRef(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileOpen]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    setProfileOpen(false);
    navigate("/login");
  };

  const handleLogoutAll = async () => {
    await dispatch(logoutAllDevices());
    setProfileOpen(false);
    navigate("/login");
  };

  const handleSwitchRole = async (targetRole) => {
    setProfileOpen(false);
    const res = await dispatch(changeActiveRole(targetRole));
    if (res.meta.requestStatus === "fulfilled") {
      if (targetRole === "teacher") {
        navigate("/teacher/dashboard");
      } else {
        navigate("/student/dashboard");
      }
    }
  };
  

  return (
    <header
      className={`h-16 px-4 md:px-6 bg-white border-b border-border flex items-center justify-between sticky top-0 z-30 select-none ${className}`}
    >
      {/* Left: Menu Toggle (<1024px)x & titles */}
      <div className="flex items-center gap-4 lg:gap-6">
        {onToggleSidebar && (
          <IconButton
            onClick={onToggleSidebar}
            title="Open menu"
            size="sm"
            className="text-charcoal hover:bg-sage"
          >
            <Menu className="w-5 h-5 text-charcoal" />
          </IconButton>
        )}
        {/* Brand Logo - directs to home */}
        <Link to="/" className="flex items-center shrink-0">
          <div className="overflow-hiddenitems-center mb-3">
            <Logo variant="full" className="h-16 mt-4 w-28" />
          </div>
        </Link>
    </div>
      
      {/* Right: Languages + Wallet + Notifications + Profile */}
      {/* Language Switcher: English | العربية | اردو | हिन्दी */}
      <div className="flex gap-4">
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
      <div className="flex items-center gap-3">
        {/* Wallet Balance Badge */}
        {role !== "admin" && (
          <Link
            to={role === "teacher" ? "/teacher/wallet" : "/student/wallet"}
            className="flex items-center gap-2 px-3 py-1.5 bg-sage hover:bg-sage/80 border border-border rounded-full transition-colors text-primary"
            title="Open Wallet"
          >
            <Wallet className="w-3.5 h-3.5 text-primary" />
            <PriceText amount={balance} size="sm" className="text-primary font-bold" />
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
          

        {/* Profile Avatar & Menu (relative parent, absolute z-[100] dropdown) */}
        <div className="relative flex items-center gap-2" ref={profileDropdownRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-sage transition-colors cursor-pointer"
            aria-expanded={profileOpen}
            aria-label="User profile menu"
          >
            <Avatar src={user?.picture} size="sm" />
          </button>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-charcoal leading-tight max-w-[120px] truncate">
                  {user.fullName}
                </span>
                <span className="text-[10px] text-primary font-medium capitalize">
                  {activeRole || user.role?.[0]}
                </span>
              </div>


          {profileOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-border rounded-xl shadow-xl z-[100] py-2 text-xs">

                

              {/* Switch Role option if user has multiple roles */}
              {Array.isArray(user?.role) && user.role.length > 1 && (
                <div className="py-1 border-b border-border">
                  <span className="px-3 py-1 text-[10px] text-muted font-bold uppercase block">
                    Switch Portal
                  </span>
                  {user.role.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleSwitchRole(r)}
                      className="w-full px-3 py-1.5 text-left text-charcoal hover:bg-sage flex items-center justify-between capitalize transition-colors"
                    >
                      <span>{r} Portal</span>
                      {activeRole === r && (
                        <Check className="w-3.5 h-3.5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Profile link */}
                {/* <Link
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
                </Link> */}

                {/* Role Switcher (Admin cannot change role per spec) */}
                  {activeRole !== "admin" && (
                    <button
                      type="button"
                      onClick={() =>
                      handleSwitchRole(
                        activeRole === "student" ? "teacher" : "student",
                      )}
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
        </div>
    </header>
  );
}
