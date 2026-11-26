import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api.service";

export const fetchChatList = createAsyncThunk(
  "chat/fetchChatList",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/chat/list");
      return response.data.chats || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load chats",
      );
    }
  },
);

export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/chat/${userId}/messages`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load conversation",
      );
    }
  },
);

export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async ({ receiverId, message, imageUrl }, { rejectWithValue }) => {
    try {
      const response = await api.post("/chat/send", {
        receiverId,
        message,
        imageUrl,
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to send message",
      );
    }
  },
);

export const markAsSeen = createAsyncThunk(
  "chat/markAsSeen",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/chat/${userId}/seen`);
      return { userId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  },
);

export const toggleBlockUser = createAsyncThunk(
  "chat/toggleBlockUser",
  async ({ userId, block }, { rejectWithValue }) => {
    try {
      const endpoint = block
        ? `/chat/${userId}/block`
        : `/chat/${userId}/unblock`;
      const response = await api.post(endpoint);
      return { userId, block, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update block status",
      );
    }
  },
);

export const toggleMuteUser = createAsyncThunk(
  "chat/toggleMuteUser",
  async ({ userId, mute }, { rejectWithValue }) => {
    try {
      const endpoint = mute ? `/chat/${userId}/mute` : `/chat/${userId}/unmute`;
      const response = await api.post(endpoint);
      return { userId, mute, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update mute status",
      );
    }
  },
);

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    chats: [],
    activeChat: null,
    messages: [],
    accessInfo: {
      canChat: true,
      reason: null,
      isMuted: false,
      isBlocked: false,
      blockedByMe: false,
    },
    typingUsers: {}, // { [userId]: boolean }
    loadingChats: false,
    loadingMessages: false,
    sendingMessage: false,
    error: null,
  },
  reducers: {
    setActiveChat: (state, action) => {
      state.activeChat = action.payload;
    },
    clearActiveChat: (state) => {
      state.activeChat = null;
      state.messages = [];
      state.accessInfo = {
        canChat: true,
        reason: null,
        isMuted: false,
        isBlocked: false,
        blockedByMe: false,
      };
    },
    receiveMessage: (state, action) => {
      const msg = action.payload;
      if (!msg || !msg._id) return;

      const activeId = state.activeChat?._id || state.activeChat?.id;
      const isFromActive =
        activeId &&
        (msg.sender === activeId ||
          msg.sender?._id === activeId ||
          msg.receiver === activeId ||
          msg.receiver?._id === activeId);

      if (isFromActive) {
        const exists = state.messages.some((m) => m._id === msg._id);
        if (!exists) {
          state.messages.push(msg);
        }
      }

      // Update in chat list
      const partnerId =
        msg.sender === activeId || msg.sender?._id === activeId
          ? msg.sender?._id || msg.sender
          : msg.receiver?._id || msg.receiver;

      const chatIndex = state.chats.findIndex(
        (c) => (c.user?._id || c.user?.id) === partnerId,
      );

      if (chatIndex !== -1) {
        state.chats[chatIndex].lastMessage = {
          _id: msg._id,
          message: msg.message,
          imageUrl: msg.imageUrl,
          sender: msg.sender?._id || msg.sender,
          receiver: msg.receiver?._id || msg.receiver,
          createdAt: msg.createdAt,
          isSeen: msg.isSeen,
        };
        state.chats[chatIndex].updatedAt = msg.createdAt;
        if (!isFromActive && msg.sender === partnerId) {
          state.chats[chatIndex].unreadCount =
            (state.chats[chatIndex].unreadCount || 0) + 1;
        }
        // Move chat to top of list
        const [movedChat] = state.chats.splice(chatIndex, 1);
        state.chats.unshift(movedChat);
      }
    },
    updateMessageSeen: (state, action) => {
      const { seenBy, seenAt } = action.payload;
      state.messages = state.messages.map((m) => {
        if (
          (m.receiver === seenBy || m.receiver?._id === seenBy) &&
          !m.isSeen
        ) {
          return { ...m, isSeen: true, seenAt: seenAt || new Date() };
        }
        return m;
      });

      // Also reset unread in chats list if active
      const partnerId = state.activeChat?._id || state.activeChat?.id;
      if (partnerId === seenBy) {
        const chatItem = state.chats.find(
          (c) => (c.user?._id || c.user?.id) === partnerId,
        );
        if (chatItem) {
          chatItem.unreadCount = 0;
        }
      }
    },
    setUserTyping: (state, action) => {
      const { userId, isTyping } = action.payload;
      if (userId) {
        state.typingUsers[userId] = Boolean(isTyping);
      }
    },
    setUserOnlineStatus: (state, action) => {
      const { userId, isOnline, lastSeen } = action.payload;
      if (!userId) return;

      const activeId = state.activeChat?._id || state.activeChat?.id;
      if (activeId === userId && state.activeChat) {
        state.activeChat.isOnline = isOnline;
        if (lastSeen) state.activeChat.lastSeen = lastSeen;
      }

      const chat = state.chats.find(
        (c) => (c.user?._id || c.user?.id) === userId,
      );
      if (chat) {
        chat.isOnline = isOnline;
        if (lastSeen && chat.user) chat.user.lastSeen = lastSeen;
      }
    },
  },
  extraReducers: (builder) => {
    // fetchChatList
    builder.addCase(fetchChatList.pending, (state) => {
      state.loadingChats = true;
      state.error = null;
    });
    builder.addCase(fetchChatList.fulfilled, (state, action) => {
      state.loadingChats = false;
      state.chats = action.payload;
    });
    builder.addCase(fetchChatList.rejected, (state, action) => {
      state.loadingChats = false;
      state.error = action.payload;
    });

    // fetchMessages
    builder.addCase(fetchMessages.pending, (state) => {
      state.loadingMessages = true;
      state.error = null;
    });
    builder.addCase(fetchMessages.fulfilled, (state, action) => {
      state.loadingMessages = false;
      state.activeChat = action.payload.partner;
      state.messages = action.payload.messages || [];
      state.accessInfo = action.payload.accessInfo || {
        canChat: true,
        reason: null,
        isMuted: false,
        isBlocked: false,
        blockedByMe: false,
      };

      // Reset unread count for this user in chat list
      const partnerId = action.payload.partner?._id;
      const chatItem = state.chats.find(
        (c) => (c.user?._id || c.user?.id) === partnerId,
      );
      if (chatItem) {
        chatItem.unreadCount = 0;
      }
    });
    builder.addCase(fetchMessages.rejected, (state, action) => {
      state.loadingMessages = false;
      state.error = action.payload;
    });

    // sendMessage
    builder.addCase(sendMessage.pending, (state) => {
      state.sendingMessage = true;
    });
    builder.addCase(sendMessage.fulfilled, (state, action) => {
      state.sendingMessage = false;
      const newMsg = action.payload;
      if (newMsg && !state.messages.some((m) => m._id === newMsg._id)) {
        state.messages.push(newMsg);
      }
      // Update last message in chat list
      const partnerId = newMsg.receiver;
      const chatIndex = state.chats.findIndex(
        (c) => (c.user?._id || c.user?.id) === partnerId,
      );
      if (chatIndex !== -1) {
        state.chats[chatIndex].lastMessage = newMsg;
        state.chats[chatIndex].updatedAt = newMsg.createdAt;
        const [moved] = state.chats.splice(chatIndex, 1);
        state.chats.unshift(moved);
      }
    });
    builder.addCase(sendMessage.rejected, (state, action) => {
      state.sendingMessage = false;
      state.error = action.payload;
    });

    // toggleBlockUser
    builder.addCase(toggleBlockUser.fulfilled, (state, action) => {
      const { block } = action.payload;
      state.accessInfo.isBlocked = block;
      state.accessInfo.blockedByMe = block;
      state.accessInfo.canChat = !block;
      if (block) {
        state.accessInfo.reason = "blocked";
      }
    });

    // toggleMuteUser
    builder.addCase(toggleMuteUser.fulfilled, (state, action) => {
      const { mute } = action.payload;
      state.accessInfo.isMuted = mute;
    });
  },
});

export const {
  setActiveChat,
  clearActiveChat,
  receiveMessage,
  updateMessageSeen,
  setUserTyping,
  setUserOnlineStatus,
} = chatSlice.actions;

export default chatSlice.reducer;
