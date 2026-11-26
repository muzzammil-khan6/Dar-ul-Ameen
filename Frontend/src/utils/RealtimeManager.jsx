import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

// Toast Context
import { useToast } from "../context/ToastContext";

import { initSocketClient, disconnectSocket } from "../services/socket.service";
import {
  receiveMessage,
  updateMessageSeen,
  setUserTyping,
  setUserOnlineStatus,
  fetchChatList,
} from "../store/slices/chatSlice";
import {
  fetchStudentBookings,
  fetchStudentTrials,
  fetchStudentWallet,
  fetchStudentDashboard,
} from "../store/slices/studentSlice";
import {
  fetchTeacherBookings,
  fetchTeacherTrials,
  fetchTeacherWallet,
  fetchTeacherDashboard,
} from "../store/slices/teacherSlice";
import {
  fetchAdminBookings,
  fetchAdminDashboard,
  fetchWalletRequests,
} from "../store/slices/adminSlice";
import {
  fetchFriendRequests,
  fetchSuggestions,
} from "../store/slices/friendSlice";

// Global Real-time Socket Dispatcher Component
export default function RealtimeManager() {
  const dispatch = useDispatch();
  const { user, activeRole } = useSelector((state) => state.auth);
  const { showToast } = useToast();

  useEffect(() => {
    const storedAccessToken = localStorage.getItem("accessToken");
    const storedRefreshToken = localStorage.getItem("refreshToken");
    if (!user || (!storedAccessToken && !storedRefreshToken)) {
      disconnectSocket();
      return;
    }

    // Wait until access token is regenerated if missing
    if (!storedAccessToken) {
      return;
    }

    const currentRole =
      activeRole || (Array.isArray(user.role) ? user.role[0] : user.role);
    const socket = initSocketClient(user);
    if (!socket) return;

    // Initial loads for real-time notifications & wallet states
    dispatch(fetchFriendRequests());
    dispatch(fetchChatList());
    if (currentRole === "student") {
      dispatch(fetchStudentWallet());
    } else if (currentRole === "teacher") {
      dispatch(fetchTeacherWallet());
    }

    // 1v1 Chat Events
    const onNewMessage = (msg) => {
      dispatch(receiveMessage(msg));
      dispatch(fetchChatList());
    };
    const onMessagesSeen = (data) => {
      dispatch(updateMessageSeen(data));
    };
    const onUserTyping = ({ fromUserId }) => {
      dispatch(setUserTyping({ userId: fromUserId, isTyping: true }));
    };
    const onUserStoppedTyping = ({ fromUserId }) => {
      dispatch(setUserTyping({ userId: fromUserId, isTyping: false }));
    };
    const onUserStatusChange = (data) => {
      dispatch(setUserOnlineStatus(data));
    };

    // Booking Status Real-Time Events
    const onBookingUpdated = (data) => {
      const status = data?.booking?.status || data?.status;
      if (currentRole === "student") {
        dispatch(fetchStudentBookings());
        dispatch(fetchStudentDashboard());
        dispatch(fetchStudentWallet());
        if (status === "accepted_by_teacher") {
          showToast("Teacher accepted your booking! Pay within 24 hours to confirm.", "success");
        } else if (status === "active") {
          showToast("Payment approved! Your 1v1 classes are now active.", "success");
        } else if (status === "expired") {
          showToast("Booking request expired (24-hour payment window passed).", "warning");
        } else if (status === "payment_rejected") {
          showToast("Payment rejected. Funds have been refunded to your wallet.", "error");
        }
      } else if (currentRole === "teacher") {
        dispatch(fetchTeacherBookings());
        dispatch(fetchTeacherDashboard());
        dispatch(fetchTeacherWallet());
        if (status === "pending") {
          showToast("New 1v1 booking request received from student!", "info");
        } else if (status === "payment_done, waiting_for_admin") {
          showToast("Student paid! Booking is awaiting admin approval.", "info");
        } else if (status === "active") {
          showToast("Payment verified! Classes have been scheduled.", "success");
        }
      } else if (currentRole === "admin") {
        dispatch(fetchAdminBookings());
        dispatch(fetchAdminDashboard());
        if (status === "payment_done, waiting_for_admin") {
          showToast("New Payment Received! Awaiting your verification.", "info");
        }
      }
    };

    // Trial Real-Time Events
    const onTrialUpdated = (data) => {
      const status = data?.trial?.status || data?.status;
      if (currentRole === "student") {
        dispatch(fetchStudentTrials());
        dispatch(fetchStudentDashboard());
        if (status === "accepted") {
          showToast("Teacher accepted your free trial class!", "success");
        } else if (status === "rejected") {
          showToast("Teacher was unavailable for this trial slot.", "warning");
        }
      } else if (currentRole === "teacher") {
        dispatch(fetchTeacherTrials());
        dispatch(fetchTeacherDashboard());
        if (status === "pending") {
          showToast("New free trial class requested by student!", "info");
        }
      }
    };

    // Wallet Real-Time Events
    const onWalletUpdated = (data) => {
      if (currentRole === "student") {
        dispatch(fetchStudentWallet());
        dispatch(fetchStudentDashboard());
        showToast("Student wallet balance updated!", "success");
      } else if (currentRole === "teacher") {
        dispatch(fetchTeacherWallet());
        dispatch(fetchTeacherDashboard());
        showToast("Teacher earnings wallet updated!", "success");
      } else if (currentRole === "admin") {
        dispatch(fetchWalletRequests());
        dispatch(fetchAdminDashboard());
        if (data?.action === "topup_requested") {
          showToast("New student wallet top-up request submitted!", "info");
        }
      }
    };

    // Class & Meet Link Real-Time Events
    const onClassUpdated = (data) => {
      if (currentRole === "student") {
        dispatch(fetchStudentBookings());
        dispatch(fetchStudentDashboard());
        if (data?.action === "meet_link_created") {
          showToast("Meet link is ready! Click Join Meet to enter class.", "info");
        }
      } else if (currentRole === "teacher") {
        dispatch(fetchTeacherBookings());
        dispatch(fetchTeacherDashboard());
        dispatch(fetchTeacherWallet());
      }
    };

    // Dashboard Statistics Events
    const onDashboardUpdated = () => {
      if (currentRole === "student") dispatch(fetchStudentDashboard());
      else if (currentRole === "teacher") dispatch(fetchTeacherDashboard());
      else if (currentRole === "admin") dispatch(fetchAdminDashboard());
    };

    // 1v1 Friend Requests Real-Time Events
    const onFriendRequestReceived = (data) => {
      dispatch(fetchFriendRequests());
      dispatch(fetchSuggestions());
      showToast(`Friend request from ${data?.fromUser?.fullName || "a user"}!`, "info");
    };

    const onFriendRequestAccepted = (data) => {
      dispatch(fetchFriendRequests());
      dispatch(fetchChatList());
      dispatch(fetchSuggestions());
      showToast("Friend request accepted! 1v1 Chat is now unlocked.", "success");
    };

    const onFriendRequestDeclined = () => {
      dispatch(fetchFriendRequests());
      dispatch(fetchSuggestions());
    };

    socket.on("newMessage", onNewMessage);
    socket.on("messagesSeen", onMessagesSeen);
    socket.on("userTyping", onUserTyping);
    socket.on("userStoppedTyping", onUserStoppedTyping);
    socket.on("userStatusChange", onUserStatusChange);
    socket.on("bookingUpdated", onBookingUpdated);
    socket.on("trialUpdated", onTrialUpdated);
    socket.on("walletUpdated", onWalletUpdated);
    socket.on("classUpdated", onClassUpdated);
    socket.on("dashboardUpdated", onDashboardUpdated);
    socket.on("friendRequestReceived", onFriendRequestReceived);
    socket.on("friendRequestAccepted", onFriendRequestAccepted);
    socket.on("friendRequestDeclined", onFriendRequestDeclined);

    return () => {
      socket.off("newMessage", onNewMessage);
      socket.off("messagesSeen", onMessagesSeen);
      socket.off("userTyping", onUserTyping);
      socket.off("userStoppedTyping", onUserStoppedTyping);
      socket.off("userStatusChange", onUserStatusChange);
      socket.off("bookingUpdated", onBookingUpdated);
      socket.off("trialUpdated", onTrialUpdated);
      socket.off("walletUpdated", onWalletUpdated);
      socket.off("classUpdated", onClassUpdated);
      socket.off("dashboardUpdated", onDashboardUpdated);
      socket.off("friendRequestReceived", onFriendRequestReceived);
      socket.off("friendRequestAccepted", onFriendRequestAccepted);
      socket.off("friendRequestDeclined", onFriendRequestDeclined);
    };
  }, [user, activeRole, dispatch, showToast]);

  return null;
}
