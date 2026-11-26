import { useEffect, Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import RealtimeManager from "./utils/RealtimeManager";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import PageSkeleton from "./components/molecules/PageSkeleton";
import {
  getMyProfile,
  forceLogout,
  refreshAccessToken,
  setAuthToken,
} from "./store/slices/authSlice";

// Toast Context
import { ToastProvider } from "./context/ToastContext";

// Public Pages (Lazy loaded for instant initial bundle)
const Home = lazy(() => import("./pages/public/Home"));
const Login = lazy(() => import("./pages/public/Login"));
const Register = lazy(() => import("./pages/public/Register"));
const Google = lazy(() => import("./pages/public/Google"));
const GoogleCallback = lazy(() => import("./pages/public/GoogleCallback"));
const TeachersList = lazy(() => import("./pages/public/TeachersList"));
const TeacherDetail = lazy(() => import("./pages/public/TeacherDetail"));

// Student Pages (Lazy loaded)
const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard"));
const StudentBookings = lazy(() => import("./pages/student/StudentBookings"));
const StudentBookingDetail = lazy(() => import("./pages/student/StudentBookingDetail"));
const StudentProfile = lazy(() => import("./pages/student/StudentProfile"));
const StudentWallet = lazy(() => import("./pages/student/StudentWallet"));

// Teacher Pages (Lazy loaded)
const TeacherScheduleView = lazy(() => import("./pages/teacher/TeacherScheduleView"));
const TeacherScheduleEdit = lazy(() => import("./pages/teacher/TeacherScheduleEdit"));
const TeacherProfile = lazy(() => import("./pages/teacher/TeacherProfile"));
const TeacherPendingApproval = lazy(() => import("./pages/teacher/TeacherPendingApproval"));
const TeacherDashboard = lazy(() => import("./pages/teacher/TeacherDashboard"));
const TeacherBookings = lazy(() => import("./pages/teacher/TeacherBookings"));
const TeacherWallet = lazy(() => import("./pages/teacher/TeacherWallet"));
const TeacherReviews = lazy(() => import("./pages/teacher/TeacherReviews"));

// Admin Pages (Lazy loaded)
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminTeachers = lazy(() => import("./pages/admin/AdminTeachers"));
const AdminSubjects = lazy(() => import("./pages/admin/AdminSubjects"));
const AdminBookings = lazy(() => import("./pages/admin/AdminBookings"));
const AdminPayments = lazy(() => import("./pages/admin/AdminPayments"));
const AdminWithdraws = lazy(() => import("./pages/admin/AdminWithdraws"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminWalletRequests = lazy(() => import("./pages/admin/AdminWalletRequests"));

// 1v1 Chat / Messenger Page (Lazy loaded)
const ChatPage = lazy(() => import("./pages/chat/ChatPage"));

import { disconnectSocket } from "./services/socket.service";


export default function App() {
  const dispatch = useDispatch();
  const { token, user, activeRole } = useSelector((state) => state.auth);

  const storedAccessToken =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const storedRefreshToken =
    typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;

  // Authenticated if user exists and has an access token or valid refresh token
  const isAuthenticated = Boolean(
    user && (storedAccessToken || storedRefreshToken),
  );

  // Listen for global custom events: logout and token refresh
  useEffect(() => {
    const handleLogoutEvent = () => {
      dispatch(forceLogout());
      disconnectSocket();
    };

    const handleTokenRefreshed = (e) => {
      if (e.detail?.accessToken) {
        dispatch(setAuthToken(e.detail));
      }
    };

    window.addEventListener("darulameen:logout", handleLogoutEvent);
    window.addEventListener("darulameen:token-refreshed", handleTokenRefreshed);
    return () => {
      window.removeEventListener("darulameen:logout", handleLogoutEvent);
      window.removeEventListener("darulameen:token-refreshed", handleTokenRefreshed);
    };
  }, [dispatch]);

  // Synchronize authentication:
  // If access token is missing but refresh token exists -> regenerate access token and remain logged in!
  // If both tokens are missing -> log out
  useEffect(() => {
    const access = localStorage.getItem("accessToken");
    const refresh = localStorage.getItem("refreshToken");

    // 1. Both tokens are missing -> ensure logged out
    if (!access && !refresh) {
      if (token || user) {
        dispatch(forceLogout());
        disconnectSocket();
      }
      return;
    }

    // 2. Access token is missing, BUT user possesses a valid refresh token:
    // Regenerate the access token and keep user logged in!
    if (!access && refresh) {
      dispatch(refreshAccessToken())
        .unwrap()
        .then(() => {
          dispatch(getMyProfile());
        })
        .catch(() => {
          dispatch(forceLogout());
          disconnectSocket();
        });
      return;
    }

    // 3. Access token exists -> fetch/verify profile
    if (access) {
      dispatch(getMyProfile());
    }
  }, [dispatch]);

  const getDashboardPath = () => {
    if (!isAuthenticated) return "/";
    const role =
      activeRole || (Array.isArray(user.role) ? user.role[0] : user.role);
    if (role === "teacher") return "/teacher/dashboard";
    if (role === "admin") return "/admin/dashboard";
    return "/student/dashboard";
  };

  return (
    <ToastProvider>
      <Router>
        <RealtimeManager />
        <div className="min-h-screen flex flex-col bg-ivory text-charcoal">
          <Navbar />
          <div className="flex-1">
            <Suspense fallback={<PageSkeleton />}>
              <Routes>
                {/* ========================================== */}
                {/* PUBLIC PAGES (No Login) */}
                {/* ========================================== */}
                <Route
                  path="/"
                  element={
                    isAuthenticated ? (
                      <Navigate to={getDashboardPath()} replace />
                    ) : (
                      <Home />
                    )
                  }
                />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/google" element={<Google />} />
                <Route path="/google-callback" element={<GoogleCallback />} />
                <Route path="/teachers" element={<TeachersList />} />
                <Route path="/teachers/:id" element={<TeacherDetail />} />

                {/* ========================================== */}
                {/* STUDENT PAGES (Protected) */}
                {/* ========================================== */}
                <Route
                  element={
                    <ProtectedRoute allowedRoles={["student"]} />
                  }
                >                  
                  <Route
                    path="/student/dashboard"
                    element={
                      <StudentDashboard />
                    }
                  />
                  
                  <Route
                    path="/student/bookings"
                    element={
                      <StudentBookings />
                    }
                  />
                  <Route
                    path="/student/bookings/:id"
                    element={
                      <StudentBookingDetail />
                    }
                  />
                  <Route
                    path="/student/wallet"
                    element={
                      <StudentWallet />
                    }
                  />
                  <Route
                    path="/student/profile"
                    element={
                      <StudentProfile />
                    }
                  />
                </Route>                  

                {/* ========================================== */}
                {/* TEACHER PAGES (Protected) */}
                {/* ========================================== */}
                <Route
                  element={
                    <ProtectedRoute allowedRoles={["teacher"]} />
                  }
                >
                  <Route
                    path="/teacher/dashboard"
                    element={
                      <TeacherDashboard />
                    }
                  />
                  <Route
                    path="/teacher/bookings"
                    element={
                      <TeacherBookings />
                    }
                  />
                  <Route
                    path="/teacher/schedule"
                    element={
                      <TeacherScheduleView />
                    }
                  />
                  <Route
                    path="/teacher/schedule/edit"
                    element={
                      <TeacherScheduleEdit />
                    }
                  />
                  < Route
                    path="/teacher/wallet"
                    element={
                      <TeacherWallet />
                  }
                  />
                  <Route
                    path="/teacher/reviews"
                    element={
                      <TeacherReviews />
                    }
                  />
                  <Route
                    path="/teacher/profile"
                    element={
                      <TeacherProfile />
                    }
                  />
                  <Route
                    path="/teacher/pending-approval"
                    element={
                      <TeacherPendingApproval />
                    }
                  />                  
                </Route>

                {/* ========================================== */}
                {/* ADMIN PAGES (Protected) */}
                {/* ========================================== */}
                <Route
                  element={
                    <ProtectedRoute allowedRoles={["admin"]} />
                  }
                >
                  <Route
                    path="/admin/dashboard"
                    element={
                      <AdminDashboard />
                    }
                  />
                  <Route
                    path="/admin/teachers"
                    element={
                      <AdminTeachers />
                    }
                  />
                  <Route
                    path="/admin/subjects"
                    element={
                    <AdminSubjects />
                    }
                  />
                  <Route
                    path="/admin/bookings"
                    element={
                      <AdminBookings />
                    }
                  />
                  <Route
                    path="/admin/payments"
                    element={
                      <AdminPayments />
                    }
                  />
                  <Route
                    path="/admin/wallet-requests"
                    element={
                      <AdminWalletRequests />
                    }
                  />
                  <Route
                    path="/admin/withdraws"
                    element={
                      <AdminWithdraws />
                    }
                  />
                  <Route
                    path="/admin/settings"
                    element={
                      <AdminSettings />
                    }
                  />
                </Route>
                  

                {/* ========================================== */}
                {/* 1v1 CHAT / MESSENGER (Protected - ALL ROLES) */}
                {/* ========================================== */}
                <Route
                  element={
                    <ProtectedRoute allowedRoles={["student", "teacher", "admin"]} />
                  }
                >
                  <Route
                    path="/chat"
                    element={
                      <ChatPage />
                    }
                  />
                  <Route
                    path="/chat/:userId"
                    element={
                      <ChatPage />
                    }
                  />
                </Route>
                  
                {/* Catch-all */}
                <Route
                  path="*"
                  element={<Navigate to={getDashboardPath()} replace />}
                />
              </Routes>
            </Suspense>
          </div>
          <Footer />
        </div>
      </Router>
    </ToastProvider>
  );
}
