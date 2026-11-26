import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  Menu,
  X,
} from "lucide-react";
import Button from "../common/Button";
import Logo from "../Logo";

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
                <Button variant="cta" size="sm" className="hidden sm:flex">
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
            {!isAuthenticated && (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="secondary" size="sm">
                    {t("nav.login") || "Log In"}
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="secondary" size="sm">
                    {t("nav.register") || "Register"}
                  </Button>
                </Link>
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

            {!isAuthenticated && (
              <div className="sm:hidden flex flex-col gap-2 pt-2 border-t border-border/50">
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
            )}
          </div>
        )}
      </div>
    </header>
  );
}
