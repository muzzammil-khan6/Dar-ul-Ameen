// Job: Dar-ul-Ameen Official Footer - Rebuilt from Reference with Deep Teal theme and exact structure
import React, { memo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import Logo from "../Logo";

const languages = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "ur", label: "اردو" },
  { code: "hi", label: "हिन्दी" },
];

function Footer() {
  const location = useLocation();
  const { i18n } = useTranslation();
  const { user } = useSelector((state) => state.auth || {});

  // Do not show footer on authenticated portal screens
  const isPortalRoute =
    location.pathname.startsWith("/student") ||
    location.pathname.startsWith("/teacher") ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/chat");

  if (user && isPortalRoute) {
    return null;
  }

  const toggleLanguage = () => {
    const nextLang = i18n.language === "ur" ? "en" : "ur";
    i18n.changeLanguage(nextLang);
  };

  return (
    <footer className="bg-primary text-white select-none pt-4 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main 5-column Footer Grid matching Reference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:py-8 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Column 1: Brand (456fr equivalent) */}
          <div className="sm:col-span-2 flex flex-row justify-start items-center gap-12 lg:gap-0 h-16">
              <Link to="/" className="flex items-center shrink-0">
                <div className="overflow-hidden items-center mb-3">
                  <Logo variant="horizontal" className="h-20 mt-2 w-48" />
              </div>             
              </Link>
            <p className="text-base text-white/70 leading-relaxed max-w-sm">
              Thoughtful learning for children.
              <br />
              Reassuring support for families.
            </p> 
          </div>
          {/* Column 2: Languages (224fr equivalent) */}
            <div className="px-8 flex flex-col items-start justify-around">
              <p className="text-base font-semibold text-white">
              Languages
              </p> 
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => handleLanguageChange(l.code)}
                  className={`text-base hover:text-amber hover:underline hover:decoration-amber underline-offset-4 transition-colors text-left ${
                    i18n.language === l.code
                      ? "bg-primary text-white"
                      : "text-muted hover:text-charcoal"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          {/* Column 3: Explore (224fr equivalent) */}
          <div className="px-8 flex flex-col gap-4">
            <h4 className="text-base font-semibold text-white">
              Explore
            </h4>
            <div className="flex flex-col gap-3">
              <a
                href="/#programs"
                className="text-base text-white/70 hover:text-amber hover:underline hover:decoration-amber underline-offset-4 transition-colors text-left"
              >
                Programs
              </a>
              <a
                href="/#how-it-works"
                className="text-base text-white/70 hover:text-amber hover:underline hover:decoration-amber underline-offset-4 transition-colors text-left"
              >
                How We Teach
              </a>
              <a
                href="/#teachers"
                className="text-base text-white/70 hover:text-amber hover:underline hover:decoration-amber underline-offset-4 transition-colors text-left"
              >
                Our Teachers
              </a>
              <a
                href="/#vision"
                className="text-base text-white/70 hover:text-amber hover:underline hover:decoration-amber underline-offset-4 transition-colors text-left"
              >
                Our Vision
              </a>
            </div>
          </div>

          {/* Column 4: Learning (224fr equivalent) */}
          <div className="px-8 flex flex-col gap-4">
            <h4 className="text-base font-semibold text-white">
              Learning
            </h4>
            <div className="flex flex-col gap-3">
              <a
                href="/#programs"
                className="text-base text-white/70 hover:text-amber hover:underline hover:decoration-amber underline-offset-4 transition-colors text-left"
              >
                Quran Foundations
              </a>
              <a
                href="/#programs"
                className="text-base text-white/70 hover:text-amber hover:underline hover:decoration-amber underline-offset-4 transition-colors text-left"
              >
                Quran Reading
              </a>
              <a
                href="/#programs"
                className="text-base text-white/70 hover:text-amber hover:underline hover:decoration-amber underline-offset-4 transition-colors text-left"
              >
                Tajweed Foundations
              </a>
            </div>
          </div>

          {/* Column 5: Help (224fr equivalent) */}
          <div className="px-8 flex flex-col gap-4">
            <h4 className="text-base font-semibold text-white">
              Help
            </h4>
            <div className="flex flex-col gap-3">
              <a
                href="/#faqs"
                className="text-base text-white/70 hover:text-amber hover:underline hover:decoration-amber underline-offset-4 transition-colors text-left"
              >
                Contact
              </a>
              <a
                href="/#faqs"
                className="text-base text-white/70 hover:text-amber hover:underline hover:decoration-amber underline-offset-4 transition-colors text-left"
              >
                FAQs
              </a>
              <Link
                to="/login"
                className="text-base text-white/70 hover:text-amber hover:underline hover:decoration-amber underline-offset-4 transition-colors text-left"
              >
                Log In
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Legal Bar matching Reference */}
        <div className="mt-10 px-8 pt-10 border-t border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 text-sm text-white/70">
          <p className="flex-1">
            © 2026 Darulameen. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              to="/about"
              className="text-white/70 hover:text-amber hover:underline hover:decoration-amber underline-offset-4 transition-colors"
            >
              Privacy
            </Link>
            <Link
              to="/about"
              className="text-white/70 hover:text-amber hover:underline hover:decoration-amber underline-offset-4 transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default memo(Footer);
