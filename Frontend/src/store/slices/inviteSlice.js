import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api.service";

export const fetchInviteSummary = createAsyncThunk(
  "invite/fetchInviteSummary",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/invites");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load invite info",
      );
    }
  },
);

export const sendEmailInvite = createAsyncThunk(
  "invite/sendEmailInvite",
  async ({ email, name }, { rejectWithValue }) => {
    try {
      const response = await api.post("/invites/email", { email, name });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to send email invite",
      );
    }
  },
);

export const createPhoneInvite = createAsyncThunk(
  "invite/createPhoneInvite",
  async ({ phone, name }, { rejectWithValue }) => {
    try {
      const response = await api.post("/invites/phone", { phone, name });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create phone invite",
      );
    }
  },
);

const inviteSlice = createSlice({
  name: "invite",
  initialState: {
    inviteCode: "",
    inviteLink: "",
    whatsappUrl: "",
    whatsappShareText: "",
    stats: {
      totalInvited: 0,
      totalJoined: 0,
      totalRewarded: 0,
      totalEarned: 0,
    },
    invites: [],
    loading: false,
    sendingEmail: false,
    creatingPhone: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    clearInviteMessage: (state) => {
      state.successMessage = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchInviteSummary
    builder.addCase(fetchInviteSummary.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchInviteSummary.fulfilled, (state, action) => {
      state.loading = false;
      state.inviteCode = action.payload.inviteCode || "";
      state.inviteLink = action.payload.inviteLink || "";
      state.whatsappUrl = action.payload.whatsappUrl || "";
      state.whatsappShareText = action.payload.whatsappShareText || "";
      state.stats = action.payload.stats || {
        totalInvited: 0,
        totalJoined: 0,
        totalRewarded: 0,
        totalEarned: 0,
      };
      state.invites = action.payload.invites || [];
    });
    builder.addCase(fetchInviteSummary.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // sendEmailInvite
    builder.addCase(sendEmailInvite.pending, (state) => {
      state.sendingEmail = true;
      state.error = null;
      state.successMessage = null;
    });
    builder.addCase(sendEmailInvite.fulfilled, (state, action) => {
      state.sendingEmail = false;
      state.successMessage =
        action.payload.message || "Invitation sent successfully!";
      if (action.payload.invite) {
        state.invites.unshift(action.payload.invite);
        state.stats.totalInvited += 1;
      }
    });
    builder.addCase(sendEmailInvite.rejected, (state, action) => {
      state.sendingEmail = false;
      state.error = action.payload;
    });

    // createPhoneInvite
    builder.addCase(createPhoneInvite.pending, (state) => {
      state.creatingPhone = true;
      state.error = null;
      state.successMessage = null;
    });
    builder.addCase(createPhoneInvite.fulfilled, (state, action) => {
      state.creatingPhone = false;
      state.successMessage = action.payload.message || "Share link prepared!";
      if (action.payload.invite) {
        state.invites.unshift(action.payload.invite);
        state.stats.totalInvited += 1;
      }
    });
    builder.addCase(createPhoneInvite.rejected, (state, action) => {
      state.creatingPhone = false;
      state.error = action.payload;
    });
  },
});

export const { clearInviteMessage } = inviteSlice.actions;
export default inviteSlice.reducer;
