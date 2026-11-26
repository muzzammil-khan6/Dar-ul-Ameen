// Job: Top dashboard header organism with user profile, wallet balance, notification bell, and role switching
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Logo from "../Logo";
import Avatar from "../atoms/Avatar";
import PriceText from "../atoms/PriceText";
import IconButton from "../atoms/IconButton";
import { logoutUser, changeActiveRole } from "../../store/slices/authSlice";
import {
  Menu,
  Wallet,
  LogOut,
  Check,
} from "lucide-react";
import NotificationBell from "../common/NotificationBell";

export default function Header({
  title = "",
  subtitle = "",
  onToggleSidebar,
  role = "student",
  className = "",
}) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, activeRole } = useSelector((state) => state.auth || {});
  const studentWallet = useSelector((state) => state.student?.wallet);
  const teacherWallet = useSelector((state) => state.teacher?.dashboard?.wallet);

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

  const handleSwitchRole = async (targetRole) => {
    await dispatch(changeActiveRole(targetRole));
    setProfileOpen(false);
    if (targetRole === "teacher") navigate("/teacher/dashboard");
    else if (targetRole === "admin") navigate("/admin/dashboard");
    else navigate("/student/dashboard");
  };
  

  return (
    <header
      className={`h-16 px-4 md:px-6 bg-white border-b border-border flex items-center justify-between sticky top-0 z-30 select-none ${className}`}
    >
      {/* Left: Mobile hamburger (<1024px)x & titles */}
      <div className="flex items-center">
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
        <Link to="/">
          <div className="rounded-xl shadow-xs sm:hidden md:block">
            <Logo variant="horizontal" className="h-[80px] w-[200px]" />
          </div>
          <div className="rounded-xl shadow-xs hidden sm:block md:hidden">
            <Logo variant="full" className="h-[65px] w-[100px]" />
          </div>
        </Link>   
      <div>
        {title && (
          <h1 className="hidden sm:block text-lg md:text-base font-bold text-charcoal leading-tight">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="text-[11px] text-muted hidden md:block lg:block">
            {subtitle}
          </p>
        )}
      </div>
    </div>

      {/* Right: Wallet + Notifications + Profile */}
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

        {/* Profile Avatar & Menu (relative parent, absolute z-[100] dropdown) */}
        <div className="relative" ref={profileDropdownRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-sage transition-colors cursor-pointer"
            aria-expanded={profileOpen}
            aria-label="User profile menu"
          >
            <Avatar src={user?.picture} size="sm" />
          </button>

          {profileOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-border rounded-xl shadow-xl z-[100] py-2 text-xs">
              <div className="px-3 py-2 border-b border-border">
                <p className="font-bold text-charcoal truncate">
                  {user?.fullName}
                </p>
                <p className="text-[10px] text-muted truncate">
                  {user?.email}
                </p>
              </div>

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

              <button
                type="button"
                onClick={handleLogout}
                className="w-full px-3 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2 mt-1 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
