// Job: 1v1 Chat page coordinating socket events, chat/friend state, and rendering ChatLayout with ChatSidebar and ChatWindow
import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  fetchChatList,
  fetchMessages,
  sendMessage,
  markAsSeen,
  toggleBlockUser,
  toggleMuteUser,
  setActiveChat,
  clearActiveChat,
} from "../../store/slices/chatSlice";
import {
  fetchSuggestions,
  fetchFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  searchPeople,
  clearSearchResults,
} from "../../store/slices/friendSlice";
import ChatLayout from "../../components/templates/ChatLayout";
import ChatSidebar from "../../components/organisms/ChatSidebar";
import ChatWindow from "../../components/organisms/ChatWindow";
import InviteModal from "../../components/organisms/InviteModal";
import { getSocket } from "../../services/socket.service";
import StudentLayout from "../../components/layout/StudentLayout";
import TeacherLayout from "../../components/layout/TeacherLayout";
import AdminLayout from "../../components/layout/AdminLayout";

export default function ChatPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { userId: urlUserId } = useParams();

  const { user, activeRole } = useSelector((state) => state.auth || {});
  const currentRole = activeRole || (Array.isArray(user?.role) ? user.role[0] : user?.role) || "student";
  const LayoutWrapper = currentRole === "teacher" ? TeacherLayout : currentRole === "admin" ? AdminLayout : StudentLayout;

  const {
    chats = [],
    activeChat = null,
    messages = [],
    accessInfo = { canChat: true, reason: null, isMuted: false, isBlocked: false, blockedByMe: false },
    typingUsers = {},
    loadingChats = false,
    loadingMessages = false,
    sendingMessage = false,
  } = useSelector((state) => state.chat || {});

  const {
    suggestions = [],
    searchResults = [],
    pendingReceived = [],
    loadingSuggestions = false,
    loadingSearch = false,
    actionLoading = false,
  } = useSelector((state) => state.friend || {});

  const [searchTerm, setSearchTerm] = useState("");
  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeTab, setActiveTab] = useState("chats");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [visibleSuggestionsCount, setVisibleSuggestionsCount] = useState(6);
  const typingTimeoutRef = useRef(null);

  // Debounced search when user types in search bar
  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      dispatch(clearSearchResults());
      return;
    }
    const timer = setTimeout(() => {
      dispatch(searchPeople(trimmed));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, dispatch]);

  // Initial load
  useEffect(() => {
    dispatch(fetchChatList());
    dispatch(fetchSuggestions());
    dispatch(fetchFriendRequests());
  }, [dispatch]);

  // Load chat from URL params or navigation state
  useEffect(() => {
    const targetId = urlUserId || location.state?.partnerId;
    if (targetId && targetId !== activeChat?._id) {
      dispatch(fetchMessages(targetId));
      dispatch(markAsSeen(targetId));
    }
  }, [urlUserId, location.state, dispatch]);

  const handleSelectChat = (partner) => {
    if (!partner?._id) return;
    dispatch(setActiveChat(partner));
    dispatch(fetchMessages(partner._id));
    dispatch(markAsSeen(partner._id));
    const socket = getSocket();
    if (socket) {
      socket.emit("joinRoom", { partnerId: partner._id });
    }
  };

  const handleTyping = () => {
    const socket = getSocket();
    if (socket && activeChat?._id) {
      socket.emit("typing", {
        toUserId: activeChat._id,
        fromName: user?.fullName || "User",
      });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stopTyping", { toUserId: activeChat._id });
      }, 1500);
    }
  };

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !selectedImage) || !activeChat?._id) return;
    const payload = {
      receiverId: activeChat._id,
      message: inputText.trim(),
      imageUrl: selectedImage,
    };
    setInputText("");
    setSelectedImage(null);
    const socket = getSocket();
    if (socket && activeChat?._id) {
      socket.emit("stopTyping", { toUserId: activeChat._id });
    }
    await dispatch(sendMessage(payload));
  };

  const handleSendFriendRequest = async (targetId) => {
    await dispatch(sendFriendRequest(targetId));
    dispatch(fetchSuggestions());
    if (searchTerm.trim()) dispatch(searchPeople(searchTerm.trim()));
  };

  const handleAcceptRequest = async (reqId) => {
    await dispatch(acceptFriendRequest(reqId));
    dispatch(fetchFriendRequests());
    dispatch(fetchChatList());
    dispatch(fetchSuggestions());
    if (searchTerm.trim()) dispatch(searchPeople(searchTerm.trim()));
  };

  const handleDeclineRequest = async (reqId) => {
    await dispatch(declineFriendRequest(reqId));
    dispatch(fetchFriendRequests());
    if (searchTerm.trim()) dispatch(searchPeople(searchTerm.trim()));
  };

  const filteredChats = chats.filter((c) => {
    const cleanSearch = searchTerm.toLowerCase().trim();
    if (!cleanSearch) return true;
    const partner = c.user;
    if (!partner) return false;
    const searchDigits = cleanSearch.replace(/\D/g, "");
    const phone = (partner.phone || partner.phoneNumber || "").toLowerCase();
    const phoneDigits = phone.replace(/\D/g, "");
    return (
      (partner.fullName || "").toLowerCase().includes(cleanSearch) ||
      (partner.email || "").toLowerCase().includes(cleanSearch) ||
      phone.includes(cleanSearch) ||
      (searchDigits.length >= 3 && phoneDigits.includes(searchDigits))
    );
  });

  return (
    <LayoutWrapper>
      <ChatLayout
        hasActiveChat={Boolean(activeChat)}
        sidebar={
          <ChatSidebar
            activeChat={activeChat}
            onSelectChat={handleSelectChat}
            searchTerm={searchTerm}
            onChangeSearch={setSearchTerm}
            onClearSearch={() => setSearchTerm("")}
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            filteredChats={filteredChats}
            loadingChats={loadingChats}
            pendingRequests={pendingReceived}
            onAcceptRequest={handleAcceptRequest}
            onDeclineRequest={handleDeclineRequest}
            suggestions={suggestions}
            loadingSuggestions={loadingSuggestions}
            onRefreshSuggestions={() => dispatch(fetchSuggestions())}
            onAddFriend={handleSendFriendRequest}
            searchResults={searchResults}
            loadingSearch={loadingSearch}
            actionLoading={actionLoading}
            visibleSuggestionsCount={visibleSuggestionsCount}
            onSeeMoreSuggestions={() => setVisibleSuggestionsCount((p) => p + 6)}
            onOpenInvite={() => setShowInviteModal(true)}
          />
        }
        chatWindow={
          <ChatWindow
            activeChat={activeChat}
            currentUserId={user?._id || user?.id}
            messages={messages}
            loadingMessages={loadingMessages}
            accessInfo={accessInfo}
            partnerIsTyping={Boolean(activeChat && typingUsers[activeChat._id])}
            inputText={inputText}
            onChangeInput={setInputText}
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
            imagePreview={selectedImage}
            onSelectImage={setSelectedImage}
            onClearImage={() => setSelectedImage(null)}
            sendingMessage={sendingMessage}
            onBack={() => dispatch(clearActiveChat())}
            onToggleMute={() => dispatch(toggleMuteUser({ userId: activeChat._id, mute: !accessInfo.isMuted }))}
            onToggleBlock={() =>
              dispatch(
                toggleBlockUser({
                  userId: activeChat._id,
                  block: !(accessInfo.isBlocked && accessInfo.blockedByMe),
                })
              )
            }
            onSendFriendRequest={handleSendFriendRequest}
            onOpenInvite={() => setShowInviteModal(true)}
          />
        }
      />

      <InviteModal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} />
    </LayoutWrapper>
  );
}
