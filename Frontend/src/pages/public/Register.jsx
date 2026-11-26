import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  UserCheck,
  RefreshCw,
  Gift,
} from "lucide-react";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Card from "../../components/common/Card";
import ErrorState from "../../components/common/ErrorState";
import Logo from "../../components/Logo";
import {
  registerUser,
  resetAuthState,
  clearTempGoogleAuth,
} from "../../store/slices/authSlice";

export default function Register() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { isLoading, isError, message, isSuccess, user, tempGoogleAuth } =
    useSelector((state) => state.auth);

  // Extract Google Auth information from location state, Redux, or sessionStorage
  const locationState = location.state || {};
  const googleAuth =
    locationState.tempToken && locationState.email
      ? locationState
      : tempGoogleAuth?.tempToken && tempGoogleAuth?.email
        ? tempGoogleAuth
        : null;

  const queryParams = new URLSearchParams(location.search);
  const refFromUrl = queryParams.get("ref");
  if (refFromUrl) {
    try {
      sessionStorage.setItem("dar_ul_ameen_ref", refFromUrl);
    } catch (e) {}
  }
  const refCode =
    refFromUrl ||
    (typeof window !== "undefined"
      ? sessionStorage.getItem("dar_ul_ameen_ref")
      : "") ||
    "";

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    country: "",
    preferredLanguage: "English",
    role: "student",
    password: "",
  });

  // Sync Google profile data into formData when Google auth is detected
  useEffect(() => {
    if (googleAuth) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || googleAuth.name || "",
        email: googleAuth.email || "",
      }));
    }
  }, [googleAuth]);

  useEffect(() => {
    dispatch(resetAuthState());
  }, [dispatch]);

  // Navigate after successful registration
  useEffect(() => {
    if (isSuccess && user) {
      if (formData.role === "teacher") {
        navigate("/teacher/pending-approval");
      } else {
        navigate("/student/dashboard");
      }
    }
  }, [isSuccess, user, formData.role, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleSelect = (selectedRole) => {
    setFormData({ ...formData, role: selectedRole });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!googleAuth?.tempToken) {
      return;
    }
    const payload = {
      ...formData,
      email: googleAuth.email, // Ensure email strictly matches Google verified email
      tempToken: googleAuth.tempToken,
      ref: refCode || undefined,
    };
    dispatch(registerUser(payload));
  };

  const handleGoogleLogin = () => {
    const backendUrl =
      import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    window.location.href = `${backendUrl}/auth/google`;
  };

  const handleMockGoogleLogin = () => {
    const backendUrl =
      import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    window.location.href = `${backendUrl}/auth/google/mock`;
  };

  const handleChangeGoogleAccount = () => {
    dispatch(clearTempGoogleAuth());
    navigate("/register", { replace: true, state: {} });
  };

  // =========================================================================
  // STEP 1: Google Login Screen (Registration form does NOT appear without it)
  // =========================================================================
  if (!googleAuth) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-ivory">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <Link to="/" className="inline-block">
              <Logo variant="full" className="h-20 w-auto mx-auto mb-4" />
            </Link>
            {refCode && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sage text-primary mb-3 shadow-xs border border-border">
                <Gift className="w-3.5 h-3.5 text-primary" />
                <span>Invited by Friend (Referral: {refCode})</span>
              </div>
            )}
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sage text-primary mb-3 border border-border">
                <ShieldCheck className="w-3.5 h-3.5" />
                {t("auth.step1Badge")}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-charcoal tracking-tight">
              {t("auth.step1Title")}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-muted">
              {t("auth.step1Subtitle")}
            </p>
          </div>

          <Card className="p-8 space-y-6 bg-white border border-border rounded-xl shadow-xs">
            <div className="p-4 bg-sage/50 border border-border rounded-xl text-xs text-charcoal leading-relaxed">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>{t("auth.googleRequiredNotice")}</span>
              </div>
            </div>

            {/* Mandatory Google Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 bg-white hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-xs cursor-pointer group"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.17 0 9.99 0 12s.46 3.83 1.26 5.42l4.02-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{t("auth.continueGoogle")}</span>
            </button>

            {/* Development / Testing quick helper */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleMockGoogleLogin}
                className="text-xs text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
              >
                ⚙️ {t("auth.devMockGoogle")}
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 text-center text-xs text-slate-500">
              {t("auth.alreadyHaveAccount")}{" "}
              <Link
                to="/login"
                className="font-semibold text-blue-600 hover:text-blue-700 ml-1"
              >
                {t("auth.loginButton")}
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STEP 2: Registration Form (Shown ONLY after Google authentication)
  // =========================================================================
  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-ivory">
      <div className="max-w-xl w-full space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-block">
            <Logo variant="full" className="h-20 w-auto mx-auto mb-4" />
          </Link>
          {refCode && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sage text-primary mb-3 shadow-xs border border-border">
              <Gift className="w-3.5 h-3.5 text-primary" />
              <span>Referred by Friend ({refCode})</span>
            </div>
          )}
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sage text-primary mb-3 border border-border">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t("auth.step2Badge")}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-charcoal tracking-tight">
            {t("auth.step2Title")}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-muted">
            {t("auth.step2Subtitle")}
          </p>
        </div>

        <Card className="p-8 bg-white border border-border rounded-xl shadow-xs">
          {/* Verified Google Account Banner */}
          <div className="mb-6 p-3.5 bg-sage/40 border border-border rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {googleAuth.picture ? (
                <img
                  src={googleAuth.picture}
                  alt={googleAuth.name || "Google User"}
                  className="w-9 h-9 rounded-full object-cover border border-border shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-sage text-primary flex items-center justify-center font-bold text-xs shrink-0">
                  G
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-muted">
                    {t("auth.googleVerifiedNotice")}
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary text-white">
                    <CheckCircle2 className="w-3 h-3" />
                    {t("auth.googleVerifiedBadge")}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-charcoal truncate">
                  {googleAuth.email}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleChangeGoogleAccount}
              className="text-xs text-muted hover:text-charcoal flex items-center gap-1 shrink-0 px-2 py-1 rounded hover:bg-sage transition-colors cursor-pointer"
              title={t("auth.changeGoogleAccount")}
            >
              <RefreshCw className="w-3 h-3" />
              <span className="hidden sm:inline">
                {t("auth.changeGoogleAccount")}
              </span>
            </button>
          </div>

          {isError && <ErrorState message={message} className="mb-4" />}

          {/* Registration Form with exact required fields */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div>
              <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-2">
                {t("auth.roleSelect")} *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleRoleSelect("student")}
                  className={`p-3 rounded-lg border text-sm font-semibold transition-all cursor-pointer text-center ${
                    formData.role === "student"
                      ? "border-primary bg-sage/60 text-primary ring-2 ring-primary"
                      : "border-border bg-white text-muted hover:border-slate-300"
                  }`}
                >
                  🎓 {t("nav.student")}
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSelect("teacher")}
                  className={`p-3 rounded-lg border text-sm font-semibold transition-all cursor-pointer text-center ${
                    formData.role === "teacher"
                      ? "border-primary bg-sage/60 text-primary ring-2 ring-primary"
                      : "border-border bg-white text-muted hover:border-slate-300"
                  }`}
                >
                  👨‍🏫 {t("nav.teacher")}
                </button>
              </div>
            </div>

            {/* Full Name */}
            <Input
              label={t("common.fullName")}
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="e.g. Tariq Mahmood"
              required
            />

            {/* Email (Locked from Google, strictly non-editable) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">
                  {t("common.email")} *
                </label>
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Lock className="w-3 h-3" />
                  {t("auth.emailLockedNotice")}
                </span>
              </div>
              <input
                type="email"
                name="email"
                value={googleAuth.email}
                disabled
                readOnly
                className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500 cursor-not-allowed select-none font-medium"
              />
            </div>

            {/* Phone */}
            <Input
              label={t("common.phone")}
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+92 300 1234567"
              required
            />

            {/* City & Country */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label={t("common.city")}
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. Karachi"
                required
              />
              <Input
                label={t("common.country")}
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="e.g. Pakistan"
                required
              />
            </div>

            {/* Preferred Language */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                {t("auth.selectLanguage")} *
              </label>
              <select
                name="preferredLanguage"
                value={formData.preferredLanguage}
                onChange={handleChange}
                className="w-full px-3.5 py-2 bg-white border border-border rounded-lg text-sm text-charcoal focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="English">English</option>
                <option value="Arabic">العربية (Arabic)</option>
                <option value="Urdu">اردو (Urdu)</option>
                <option value="Hindi">हिन्दी (Hindi)</option>
              </select>
            </div>

            {/* Password */}
            <Input
              label={t("common.password")}
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              required
            />

            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              className="w-full mt-2"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              {t("auth.registerButton")}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-muted">
            {t("auth.alreadyHaveAccount")}{" "}
            <Link
              to="/login"
              className="font-semibold text-primary hover:text-primaryDark transition-colors"
            >
              {t("auth.loginButton")}
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
