import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api.service";

export const fetchStudentDashboard = createAsyncThunk(
  "student/fetchDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/student/dashboard");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load dashboard",
      );
    }
  },
);

export const fetchStudentBookings = createAsyncThunk(
  "student/fetchBookings",
  async (statusFilter, { rejectWithValue }) => {
    try {
      const url =
        statusFilter && statusFilter !== "All"
          ? `/student/bookings?status=${statusFilter.toLowerCase()}`
          : "/student/bookings";
      const response = await api.get(url);
      return response.data.bookings;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch bookings",
      );
    }
  },
);

export const fetchStudentBookingDetail = createAsyncThunk(
  "student/fetchBookingDetail",
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/student/bookings/${bookingId}`);
      return response.data.booking;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch booking detail",
      );
    }
  },
);

export const createBooking = createAsyncThunk(
  "student/createBooking",
  async (bookingData, { rejectWithValue }) => {
    try {
      const response = await api.post("/bookings", bookingData);
      return response.data.booking;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create booking",
      );
    }
  },
);

export const payForBooking = createAsyncThunk(
  "student/payForBooking",
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await api.post("/payments/pay", paymentData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Payment failed");
    }
  },
);

export const cancelStudentBooking = createAsyncThunk(
  "student/cancelBooking",
  async ({ bookingId, reason }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/bookings/${bookingId}/cancel`, {
        reason,
      });
      return response.data.booking;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to cancel booking",
      );
    }
  },
);

export const sendChatMessage = createAsyncThunk(
  "student/sendChat",
  async ({ bookingId, message }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/chat`, {
        message,
      });
      return response.data.chat;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to send chat",
      );
    }
  },
);

export const submitReview = createAsyncThunk(
  "student/submitReview",
  async (reviewData, { rejectWithValue }) => {
    try {
      const response = await api.post("/reviews", reviewData);
      return response.data.review;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to submit review",
      );
    }
  },
);

// ==========================================
// TRIAL ACTIONS
// ==========================================
export const createTrial = createAsyncThunk(
  "student/createTrial",
  async (trialData, { rejectWithValue }) => {
    try {
      const response = await api.post("/trials", trialData);
      return response.data.trial;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to request trial",
      );
    }
  },
);

export const fetchStudentTrials = createAsyncThunk(
  "student/fetchTrials",
  async (statusFilter, { rejectWithValue }) => {
    try {
      const url =
        statusFilter && statusFilter !== "All"
          ? `/trials/student?status=${statusFilter.toLowerCase()}`
          : "/trials/student";
      const response = await api.get(url);
      return response.data.trials;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch trials",
      );
    }
  },
);

export const cancelStudentTrial = createAsyncThunk(
  "student/cancelTrial",
  async ({ trialId, reason }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/trials/${trialId}/cancel`, { reason });
      return response.data.trial;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to cancel trial",
      );
    }
  },
);

// ==========================================
// WALLET ACTIONS
// ==========================================
export const fetchStudentWallet = createAsyncThunk(
  "student/fetchWallet",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/student/wallet");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch wallet",
      );
    }
  },
);

export const requestWalletTopup = createAsyncThunk(
  "student/requestTopup",
  async (topupData, { rejectWithValue }) => {
    try {
      const response = await api.post("/student/wallet/topup", topupData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to submit topup request",
      );
    }
  },
);

export const fetchPaymentSettings = createAsyncThunk(
  "student/fetchPaymentSettings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/student/payment-settings");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch payment settings",
      );
    }
  },
);

const initialState = {
  dashboard: null,
  bookings: [],
  trials: [],
  currentBooking: null,
  wallet: { balance: 0, transactions: [], topups: [] },
  paymentSettings: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: "",
};

const studentSlice = createSlice({
  name: "student",
  initialState,
  reducers: {
    clearCurrentBooking: (state) => {
      state.currentBooking = null;
    },
    resetStudentState: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // DASHBOARD
      .addCase(fetchStudentDashboard.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchStudentDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboard = action.payload;
      })
      .addCase(fetchStudentDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // BOOKINGS
      .addCase(fetchStudentBookings.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchStudentBookings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bookings = action.payload;
      })
      .addCase(fetchStudentBookings.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // BOOKING DETAIL
      .addCase(fetchStudentBookingDetail.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchStudentBookingDetail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentBooking = action.payload;
      })
      .addCase(fetchStudentBookingDetail.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // CREATE BOOKING
      .addCase(createBooking.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = "Booking created successfully";
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // PAY
      .addCase(payForBooking.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(payForBooking.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = "Payment successful!";
        if (state.currentBooking) {
          state.currentBooking.status = "active";
          state.currentBooking.isPaid = true;
        }
      })
      .addCase(payForBooking.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // CANCEL
      .addCase(cancelStudentBooking.fulfilled, (state, action) => {
        state.message = "Booking cancelled";
        if (state.currentBooking) {
          state.currentBooking.status = "cancelled";
        }
      })

      // CHAT
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        if (state.currentBooking) {
          if (!state.currentBooking.chat) state.currentBooking.chat = [];
          state.currentBooking.chat.push(action.payload);
        }
      })

      // REVIEW
      .addCase(submitReview.fulfilled, (state) => {
        state.isSuccess = true;
        state.message = "Review submitted successfully!";
      })

      // TRIALS
      .addCase(createTrial.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(createTrial.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.trials = [action.payload, ...(state.trials || [])];
        state.message = "Trial requested successfully!";
      })
      .addCase(createTrial.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(fetchStudentTrials.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchStudentTrials.fulfilled, (state, action) => {
        state.isLoading = false;
        state.trials = action.payload;
      })
      .addCase(fetchStudentTrials.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(cancelStudentTrial.fulfilled, (state, action) => {
        state.trials = (state.trials || []).map((t) =>
          t._id === action.payload._id ? action.payload : t,
        );
      })

      // WALLET
      .addCase(fetchStudentWallet.fulfilled, (state, action) => {
        state.wallet = action.payload;
      })
      .addCase(requestWalletTopup.fulfilled, (state, action) => {
        if (action.payload?.topup) {
          state.wallet.topups = [
            action.payload.topup,
            ...(state.wallet.topups || []),
          ];
        }
      })
      .addCase(fetchPaymentSettings.fulfilled, (state, action) => {
        state.paymentSettings = action.payload;
      });
  },
});

export const { clearCurrentBooking, resetStudentState } = studentSlice.actions;
export default studentSlice.reducer;
