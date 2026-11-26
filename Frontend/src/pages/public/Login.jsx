import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { LogIn } from "lucide-react";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Card from "../../components/common/Card";
import ErrorState from "../../components/common/ErrorState";
import Logo from "../../components/Logo";
import {
  loginUser,
  resetAuthState,
  forceLogout,
  refreshAccessToken,
  getMyProfile,
} from "../../store/slices/authSlice";

export default function Login() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { user, token, activeRole, isLoading, isError, message } = useSelector(
    (state) => state.auth,
  );

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    dispatch(resetAuthState());
  }, [dispatch]);

  // If user possesses a valid refresh token, regenerate access token and navigate to dashboard
  useEffect(() => {
    const storedAccessToken = localStorage.getItem("accessToken");
    const storedRefreshToken = localStorage.getItem("refreshToken");

    // 1. If NO refresh token exists at all -> clean up stale state and stay on /login
    if (!storedRefreshToken) {
      if (token || user) {
        dispatch(forceLogout());
      }
      return;
    }

    // 2. If access token is missing but refresh token exists -> regenerate access token!
    if (!storedAccessToken && storedRefreshToken) {
      dispatch(refreshAccessToken())
        .unwrap()
        .then(() => {
          dispatch(getMyProfile());
        })
        .catch(() => {
          dispatch(forceLogout());
        });
      return;
    }

    // 3. User is logged in with active tokens -> redirect to appropriate dashboard
    if (storedAccessToken && user) {
      const from =
        typeof location.state?.from === "string"
          ? location.state.from
          : location.state?.from?.pathname
            ? `${location.state.from.pathname}${location.state.from.search || ""}`
            : null;
      if (from) {
        navigate(from, { replace: true });
      } else if (activeRole === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (activeRole === "teacher") {
        if (user.teachingStatus === "pending") {
          navigate("/teacher/pending-approval", { replace: true });
        } else {
          navigate("/teacher/dashboard", { replace: true });
        }
      } else {
        navigate("/student/dashboard", { replace: true });
      }
    }
  }, [token, user, activeRole, navigate, location, dispatch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(loginUser(formData));
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-ivory">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-block">
            <Logo variant="full" className="h-20 w-auto mx-auto mb-4" />
          </Link>
          <h2 className="text-2xl sm:text-3xl font-bold text-charcoal tracking-tight">
            {t("auth.loginTitle")}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-muted">
            {t("auth.loginSubtitle")}
          </p>
        </div>

        <Card className="p-8 bg-white border border-border rounded-xl shadow-xs">
          {isError && <ErrorState message={message} className="mb-4" />}

          {/* Direct Email / Password Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t("common.email")}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />

            <Input
              label={t("common.password")}
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />

            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              className="w-full"
            >
              <LogIn className="w-4 h-4 mr-2" />
              {t("auth.loginButton")}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-muted">
            {t("auth.dontHaveAccount")}{" "}
            <Link
              to="/register"
              className="font-semibold text-primary hover:text-primaryDark transition-colors"
            >
              {t("auth.registerButton")}
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
