import { useEffect, useState } from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  forceLogout,
  refreshAccessToken,
  getMyProfile,
} from "../../store/slices/authSlice";
import { disconnectSocket } from "../../services/socket.service";

export default function ProtectedRoute({ allowedRoles, children }) {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, token, activeRole, isLoading } = useSelector(
    (state) => state.auth,
  );

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);

  const storedAccessToken =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const storedRefreshToken =
    typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;

  useEffect(() => {
    // If access token is missing but user has a valid refresh token, regenerate access token
    if (
      !storedAccessToken &&
      storedRefreshToken &&
      !isRefreshing &&
      !refreshFailed
    ) {
      setIsRefreshing(true);
      dispatch(refreshAccessToken())
        .unwrap()
        .then(() => {
          setIsRefreshing(false);
          dispatch(getMyProfile());
        })
        .catch(() => {
          setIsRefreshing(false);
          setRefreshFailed(true);
          dispatch(forceLogout());
          disconnectSocket();
        });
    }
  }, [
    storedAccessToken,
    storedRefreshToken,
    isRefreshing,
    refreshFailed,
    dispatch,
  ]);

  // 1. Missing refresh token entirely or refresh attempt failed -> force logout and redirect to /login
  if (!storedRefreshToken || refreshFailed) {
    if (token || user) {
      dispatch(forceLogout());
      disconnectSocket();
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Access token regeneration in progress -> show spinner and keep user on the page
  if (!storedAccessToken || isRefreshing) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // 3. Token exists, but profile request finished and user is still null -> profile failed, log out
  if (!isLoading && !user) {
    dispatch(forceLogout());
    disconnectSocket();
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 4. Token exists but profile is still loading
  if (isLoading || !user) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const currentRole =
    activeRole ||
    (typeof user.role === "string"
      ? user.role
      : Array.isArray(user.role)
      ? user.role[0]
      : "student");

  // 5. Check if user's activeRole is in allowedRoles
  const hasAccess =
    !allowedRoles ||
    allowedRoles.includes(currentRole) ||
    (Array.isArray(user.roles) && user.roles.some((r) => allowedRoles.includes(r)));

  if (!hasAccess) {
    // Redirect to user's own dashboard
    if (currentRole === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (currentRole === "teacher") {
      return <Navigate to="/teacher/dashboard" replace />;
    } else {
      return <Navigate to="/student/dashboard" replace />;
    }
  }

  return <Outlet />;
}
