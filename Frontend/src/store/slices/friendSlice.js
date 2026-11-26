import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api.service";

export const fetchSuggestions = createAsyncThunk(
  "friend/fetchSuggestions",
  async (query, { rejectWithValue }) => {
    try {
      const url = query
        ? `/friends/suggestions?q=${encodeURIComponent(query)}`
        : "/friends/suggestions";
      const response = await api.get(url);
      return response.data.suggestions || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load suggestions",
      );
    }
  },
);

export const searchPeople = createAsyncThunk(
  "friend/searchPeople",
  async (query, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/friends/search?q=${encodeURIComponent(query || "")}`,
      );
      return response.data.results || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to search people",
      );
    }
  },
);

export const fetchFriendRequests = createAsyncThunk(
  "friend/fetchFriendRequests",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/friends/requests");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load friend requests",
      );
    }
  },
);

export const sendFriendRequest = createAsyncThunk(
  "friend/sendFriendRequest",
  async (targetUserId, { rejectWithValue }) => {
    try {
      const response = await api.post("/friends/request", { targetUserId });
      return { targetUserId, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to send friend request",
      );
    }
  },
);

export const acceptFriendRequest = createAsyncThunk(
  "friend/acceptFriendRequest",
  async (requestId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/friends/request/${requestId}/accept`);
      return { requestId, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to accept friend request",
      );
    }
  },
);

export const declineFriendRequest = createAsyncThunk(
  "friend/declineFriendRequest",
  async (requestId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/friends/request/${requestId}/decline`);
      return { requestId, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to decline friend request",
      );
    }
  },
);

const friendSlice = createSlice({
  name: "friend",
  initialState: {
    suggestions: [],
    searchResults: [],
    pendingReceived: [],
    pendingSent: [],
    loadingSuggestions: false,
    loadingSearch: false,
    loadingRequests: false,
    actionLoading: false,
    error: null,
  },
  reducers: {
    removeSuggestion: (state, action) => {
      const targetId = action.payload;
      state.suggestions = state.suggestions.filter(
        (s) => s.user?._id !== targetId && s.user?.id !== targetId,
      );
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.loadingSearch = false;
    },
  },
  extraReducers: (builder) => {
    // fetchSuggestions
    builder.addCase(fetchSuggestions.pending, (state) => {
      state.loadingSuggestions = true;
      state.error = null;
    });
    builder.addCase(fetchSuggestions.fulfilled, (state, action) => {
      state.loadingSuggestions = false;
      state.suggestions = action.payload;
    });
    builder.addCase(fetchSuggestions.rejected, (state, action) => {
      state.loadingSuggestions = false;
      state.error = action.payload;
    });

    // fetchFriendRequests
    builder.addCase(fetchFriendRequests.pending, (state) => {
      state.loadingRequests = true;
      state.error = null;
    });
    builder.addCase(fetchFriendRequests.fulfilled, (state, action) => {
      state.loadingRequests = false;
      state.pendingReceived = action.payload.received || [];
      state.pendingSent = action.payload.sent || [];
    });
    builder.addCase(fetchFriendRequests.rejected, (state, action) => {
      state.loadingRequests = false;
      state.error = action.payload;
    });

    // sendFriendRequest
    builder.addCase(sendFriendRequest.pending, (state) => {
      state.actionLoading = true;
    });
    builder.addCase(sendFriendRequest.fulfilled, (state, action) => {
      state.actionLoading = false;
      const targetId = action.payload.targetUserId;
      // Mark suggestion as sent
      state.suggestions = state.suggestions.map((s) => {
        if (s.user?._id === targetId || s.user?.id === targetId) {
          return { ...s, requestSent: true };
        }
        return s;
      });
      // Mark search result as sent
      state.searchResults = state.searchResults.map((r) => {
        if (r.user?._id === targetId || r.user?.id === targetId) {
          return { ...r, connectionStatus: "pending_sent" };
        }
        return r;
      });
      if (action.payload.friendship) {
        state.pendingSent.push(action.payload.friendship);
      }
    });
    builder.addCase(sendFriendRequest.rejected, (state, action) => {
      state.actionLoading = false;
      state.error = action.payload;
    });

    // searchPeople
    builder.addCase(searchPeople.pending, (state) => {
      state.loadingSearch = true;
      state.error = null;
    });
    builder.addCase(searchPeople.fulfilled, (state, action) => {
      state.loadingSearch = false;
      state.searchResults = action.payload;
    });
    builder.addCase(searchPeople.rejected, (state, action) => {
      state.loadingSearch = false;
      state.error = action.payload;
    });

    // acceptFriendRequest
    builder.addCase(acceptFriendRequest.fulfilled, (state, action) => {
      const { requestId } = action.payload;
      state.pendingReceived = state.pendingReceived.filter(
        (r) => r._id !== requestId,
      );
    });

    // declineFriendRequest
    builder.addCase(declineFriendRequest.fulfilled, (state, action) => {
      const { requestId } = action.payload;
      state.pendingReceived = state.pendingReceived.filter(
        (r) => r._id !== requestId,
      );
    });
  },
});

export const { removeSuggestion, clearSearchResults } = friendSlice.actions;
export default friendSlice.reducer;
