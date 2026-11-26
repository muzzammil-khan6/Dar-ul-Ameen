// Job: Responsive dashboard sidebar navigation organism for Student, Teacher, and Admin portals
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Logo from "../Logo";
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Search,
  User,
  Wallet,
  MessageSquare,
  GraduationCap,
  Settings,
  Users,
  Star,
  X,
} from "lucide-react";

export default function Sidebar({
  role = "student",
  isOpen = false,
  onClose,
  className = "",
}) {
  const location = useLocation();
  const chats = useSelector((state) => state.chat?.chats || []);
  const unreadMessages = Array.isArray(chats)
    ? chats.reduce((acc, c) => acc + (c?.unreadCount || 0), 0)
    : 0;

  const linksByRole = {
    student: [
      { to: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/student/bookings", label: "1v1 Bookings", icon: BookOpen },
      { to: "/chat", label: "1v1 Messenger", icon: MessageSquare, badge: unreadMessages },
      { to: "/teachers", label: "Find Teachers", icon: Search },
      { to: "/student/wallet", label: "My Wallet", icon: Wallet },
      { to: "/student/profile", label: "My Profile", icon: User },
    ],
    teacher: [
      { to: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/teacher/bookings", label: "1v1 Bookings", icon: BookOpen },
      { to: "/teacher/schedule", label: "1v1 Schedule", icon: Calendar },
      { to: "/chat", label: "1v1 Messenger", icon: MessageSquare, badge: unreadMessages },
      { to: "/teacher/wallet", label: "Earnings Wallet", icon: Wallet },
      { to: "/teacher/reviews", label: "Student Reviews", icon: Star },
      { to: "/teacher/profile", label: "Teacher Profile", icon: User },
    ],
    admin: [
      { to: "/admin/dashboard", label: "Admin Overview", icon: LayoutDashboard },
      { to: "/admin/bookings", label: "1v1 Bookings Review", icon: BookOpen },
      { to: "/admin/wallet-requests", label: "Top-Up Requests", icon: Wallet },
      { to: "/admin/teachers", label: "Teacher Approvals", icon: Users },
      { to: "/admin/subjects", label: "Subjects & Rates", icon: GraduationCap },
      { to: "/chat", label: "1v1 Messenger", icon: MessageSquare, badge: unreadMessages },
      { to: "/admin/settings", label: "Payment Settings", icon: Settings },
    ],
  };

  const navLinks = linksByRole[role] || linksByRole.student;

  return (
    <>
      {/* Mobile Backdrop Overlay (z-50) */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-50"
          aria-hidden="true"
        />
      )}

      {/* Sidebar: sticky on desktop (>=1024px), fixed drawer on mobile (<1024px) */}
      <aside
        className={`fixed top-0 left-0 h-screen w-[260px] shrink-0 bg-white border-r border-border z-50  flex flex-col justify-between transition-transform duration-200 ease-in-out select-none ${
          isOpen ? "translate-x-0 lg:sticky md:sticky" : "-translate-x-full"
        } ${className}`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-primary flex items-center justify-center shadow-xs">
                <Logo variant="icon" className="h-8 w-8" />
              </div>
              <div>
                <span className="font-extrabold text-charcoal text-base tracking-tight block">
                  Dar-ul-Ameen
                </span>
                <span className="text-[10px] uppercase font-bold text-amber tracking-wider">
                  {role} Portal
                </span>
              </div>
            </Link>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-muted hover:text-charcoal rounded-lg hover:bg-sage transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-2 space-y-1 overflow-y-auto flex-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                location.pathname === link.to ||
                (link.to === "/chat" && location.pathname.startsWith("/chat"));

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className={`flex items-center justify-between px-3.5 py-2.5 text-xs transition-all ${
                    isActive
                      ? "bg-sage text-primary border-l-4 border-amber font-semibold"
                      : "text-charcoal hover:bg-sage border-l-4 border-transparent font-medium"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? "text-primary" : "text-muted"
                      }`}
                    />
                    <span>{link.label}</span>
                  </div>
                  {Boolean(link.badge) && link.badge > 0 && (
                    <span className="w-4 h-4 rounded-full bg-amber text-charcoal text-[10px] font-bold flex items-center justify-center">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-border text-[11px] text-muted">
          <p>© 2026 Dar-ul-Ameen</p>
          <p className="text-[10px] text-muted/80 mt-0.5">
            1v1 Online Learning Platform
          </p>
        </div>
      </aside>
    </>
  );
}
