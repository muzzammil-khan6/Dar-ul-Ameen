import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Bell,
  UserPlus,
  MessageSquare,
  Check,
  X,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import {
  fetchFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
} from "../../store/slices/friendSlice";
import { fetchChatList } from "../../store/slices/chatSlice";

export default function NotificationBell() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { pendingReceived = [] } = useSelector((state) => state.friend || {});
  const { chats = [] } = useSelector((state) => state.chat || {});

  const totalUnreadMessages = Array.isArray(chats)
    ? chats.reduce((acc, c) => acc + (c?.unreadCount || 0), 0)
    : 0;

  const totalNotifications = (pendingReceived?.length || 0) + totalUnreadMessages;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAcceptRequest = async (e, friendshipId) => {
    e.stopPropagation();
    await dispatch(acceptFriendRequest(friendshipId));
    dispatch(fetchFriendRequests());
    dispatch(fetchChatList());
  };

  const handleDeclineRequest = async (e, friendshipId) => {
    e.stopPropagation();
    await dispatch(declineFriendRequest(friendshipId));
    dispatch(fetchFriendRequests());
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {totalNotifications > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {totalNotifications > 9 ? "9+" : totalNotifications}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-border z-[100] overflow-hidden">
          {/* Header */}
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-xs text-slate-800">
                Notifications ({totalNotifications})
              </span>
            </div>
            {totalNotifications > 0 && (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Real-time Active
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {/* Friend Requests Section */}
            {pendingReceived.length > 0 && (
              <div className="p-3 bg-amber-50/40">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-2">
                  <UserPlus className="w-3.5 h-3.5 text-amber-600" />
                  Friend Requests ({pendingReceived.length})
                </div>
                <div className="space-y-2">
                  {pendingReceived.map((req) => {
                    const requester = req.requester || {};
                    return (
                      <div
                        key={req._id}
                        className="p-2.5 rounded-xl bg-white border border-amber-200/70 shadow-xs flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={
                              requester.picture ||
                              "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"
                            }
                            alt=""
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">
                              {requester.fullName || "Someone"}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              Wants to connect for 1v1 chat
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => handleAcceptRequest(e, req._id)}
                            className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                            title="Accept"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeclineRequest(e, req._id)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                            title="Decline"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Unread 1v1 Messages Section */}
            {totalUnreadMessages > 0 && (
              <div className="p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800 mb-2">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  Unread Messages ({totalUnreadMessages})
                </div>
                <div className="space-y-1.5">
                  {chats
                    .filter((c) => (c.unreadCount || 0) > 0)
                    .map((c) => (
                      <Link
                        key={c.user?._id || c.user?.id}
                        to="/chat"
                        onClick={() => setIsOpen(false)}
                        className="p-2 rounded-xl hover:bg-slate-50 flex items-center justify-between transition-colors text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={
                              c.user?.picture ||
                              "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"
                            }
                            alt=""
                            className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">
                              {c.user?.fullName}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">
                              {c.lastMessage?.message || "New message"}
                            </p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                          {c.unreadCount} new
                        </span>
                      </Link>
                    ))}
                </div>
              </div>
            )}

            {totalNotifications === 0 && (
              <div className="p-6 text-center text-xs text-slate-400">
                <Sparkles className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
                No new notifications. Everything is up to date!
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
            <Link
              to="/chat"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
            >
              Open 1v1 Messenger
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
