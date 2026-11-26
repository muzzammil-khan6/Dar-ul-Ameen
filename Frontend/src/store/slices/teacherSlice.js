import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api.service";

export const fetchTeacherSchedule = createAsyncThunk(
  "teacher/fetchSchedule",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/teacher/schedule");
      return response.data.schedule;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch schedule",
      );
    }
  },
);

export const updateTeacherSchedule = createAsyncThunk(
  "teacher/updateSchedule",
  async (scheduleData, { rejectWithValue }) => {
    try {
      const response = await api.put("/teacher/schedule", scheduleData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update schedule",
      );
    }
  },
);

export const deleteScheduleSlot = createAsyncThunk(
  "teacher/deleteSlot",
  async (slotId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/teacher/schedule/slot/${slotId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete slot",
      );
    }
  },
);

export const addOrUpdateSubjectCard = createAsyncThunk(
  "teacher/addOrUpdateSubjectCard",
  async (cardData, { rejectWithValue }) => {
    try {
      const response = await api.post("/teacher/schedule/card", cardData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to save subject card",
      );
    }
  },
);

export const deleteSubjectCard = createAsyncThunk(
  "teacher/deleteSubjectCard",
  async (subjectName, { rejectWithValue }) => {
    try {
      const response = await api.delete(
        `/teacher/schedule/card/${encodeURIComponent(subjectName)}`,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete subject card",
      );
    }
  },
);

export const updateTeacherDays = createAsyncThunk(
  "teacher/updateTeacherDays",
  async (daysData, { rejectWithValue }) => {
    try {
      const response = await api.put("/teacher/schedule/days", daysData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update days",
      );
    }
  },
);

export const addScheduleSlot = createAsyncThunk(
  "teacher/addScheduleSlot",
  async (slotData, { rejectWithValue }) => {
    try {
      const response = await api.post("/teacher/schedule/slot", slotData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add time slot",
      );
    }
  },
);

export const fetchTeacherDashboard = createAsyncThunk(
  "teacher/fetchDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/teacher/dashboard");
      return response.data;
    } catch (error) {
      const status = error.response?.data?.status;
      const message =
        error.response?.data?.message || "Failed to load dashboard";
      return rejectWithValue({ status, message });
    }
  },
);

export const fetchTeacherBookings = createAsyncThunk(
  "teacher/fetchBookings",
  async (statusFilter, { rejectWithValue }) => {
    try {
      const url =
        statusFilter && statusFilter !== "All"
          ? `/teacher/bookings?status=${statusFilter.toLowerCase()}`
          : "/teacher/bookings";
      const response = await api.get(url);
      return response.data.bookings;
    } catch (error) {
      const status = error.response?.data?.status;
      const message =
        error.response?.data?.message || "Failed to fetch bookings";
      return rejectWithValue({ status, message });
    }
  },
);

export const acceptTeacherBooking = createAsyncThunk(
  "teacher/acceptBooking",
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/bookings/${bookingId}/accept`);
      return response.data.booking;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to accept booking",
      );
    }
  },
);

export const rejectTeacherBooking = createAsyncThunk(
  "teacher/rejectBooking",
  async (payload, { rejectWithValue }) => {
    try {
      const bookingId =
        typeof payload === "object" ? payload.bookingId || payload.id : payload;
      const reason =
        typeof payload === "object"
          ? payload.reason || "Rejected by teacher"
          : "Rejected by teacher";
      const response = await api.put(`/bookings/${bookingId}/reject`, {
        reason,
      });
      return response.data.booking;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to reject booking",
      );
    }
  },
);

export const completeClassSession = createAsyncThunk(
  "teacher/completeClass",
  async (classId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/classes/${classId}/complete`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to complete class",
      );
    }
  },
);

export const fetchTeacherWallet = createAsyncThunk(
  "teacher/fetchWallet",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/teacher/wallet");
      return response.data;
    } catch (error) {
      const status = error.response?.data?.status;
      const message = error.response?.data?.message || "Failed to load wallet";
      return rejectWithValue({ status, message });
    }
  },
);

export const requestWithdrawal = createAsyncThunk(
  "teacher/requestWithdrawal",
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post("/teacher/wallet/withdraw", data);
      return response.data.withdraw;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Withdrawal request failed",
      );
    }
  },
);

export const fetchTeacherReviews = createAsyncThunk(
  "teacher/fetchReviews",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/teacher/reviews");
      return response.data;
    } catch (error) {
      const status = error.response?.data?.status;
      const message = error.response?.data?.message || "Failed to load reviews";
      return rejectWithValue({ status, message });
    }
  },
);

export const sendTeacherChat = createAsyncThunk(
  "teacher/sendChat",
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

// ==========================================
// TRIAL ACTIONS
// ==========================================
export const fetchTeacherTrials = createAsyncThunk(
  "teacher/fetchTrials",
  async (statusFilter, { rejectWithValue }) => {
    try {
      const url =
        statusFilter && statusFilter !== "All"
          ? `/trials/teacher?status=${statusFilter.toLowerCase()}`
          : "/trials/teacher";
      const response = await api.get(url);
      return response.data.trials;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch trial requests",
      );
    }
  },
);

export const acceptTeacherTrial = createAsyncThunk(
  "teacher/acceptTrial",
  async (trialId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/trials/${trialId}/accept`);
      return response.data.trial;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to accept trial",
      );
    }
  },
);

export const rejectTeacherTrial = createAsyncThunk(
  "teacher/rejectTrial",
  async (payload, { rejectWithValue }) => {
    try {
      const trialId =
        typeof payload === "object" ? payload.trialId || payload.id : payload;
      const reason =
        typeof payload === "object"
          ? payload.reason || "Teacher unavailable at requested time"
          : "Teacher unavailable at requested time";
      const response = await api.put(`/trials/${trialId}/reject`, { reason });
      return response.data.trial;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to reject trial",
      );
    }
  },
);

export const cancelTeacherTrial = createAsyncThunk(
  "teacher/cancelTrial",
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

export const completeTeacherTrial = createAsyncThunk(
  "teacher/completeTrial",
  async (trialId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/trials/${trialId}/complete`);
      return response.data.trial;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to complete trial",
      );
    }
  },
);

const initialState = {
  schedule: null,
  dashboard: null,
  bookings: [],
  trials: [],
  wallet: null,
  reviewsData: null,
  isPendingApproval: false,
  pendingApprovalMessage: "",
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: "",
};

const teacherSlice = createSlice({
  name: "teacher",
  initialState,
  reducers: {
    resetTeacherState: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // SCHEDULE
      .addCase(fetchTeacherSchedule.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchTeacherSchedule.fulfilled, (state, action) => {
        state.isLoading = false;
        state.schedule = action.payload;
      })
      .addCase(fetchTeacherSchedule.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // UPDATE SCHEDULE (Wizard Save)
      .addCase(updateTeacherSchedule.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
      })
      .addCase(updateTeacherSchedule.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.schedule = action.payload.schedule;
        state.isPendingApproval = true;
        state.pendingApprovalMessage =
          "Your profile is under review. Admin has not approved you yet. You will get access after approval.";
        state.message = action.payload.message;
      })
      .addCase(updateTeacherSchedule.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // ADD OR UPDATE SUBJECT CARD
      .addCase(addOrUpdateSubjectCard.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(addOrUpdateSubjectCard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.schedule = action.payload.schedule;
        state.message = action.payload.message;
      })
      .addCase(addOrUpdateSubjectCard.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // DELETE SUBJECT CARD
      .addCase(deleteSubjectCard.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(deleteSubjectCard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.schedule = action.payload.schedule;
        state.message = action.payload.message;
      })
      .addCase(deleteSubjectCard.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // UPDATE TEACHER DAYS
      .addCase(updateTeacherDays.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(updateTeacherDays.fulfilled, (state, action) => {
        state.isLoading = false;
        state.schedule = action.payload.schedule;
        state.message = action.payload.message;
      })
      .addCase(updateTeacherDays.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // ADD TIME SLOT
      .addCase(addScheduleSlot.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(addScheduleSlot.fulfilled, (state, action) => {
        state.isLoading = false;
        state.schedule = action.payload.schedule;
        state.message = action.payload.message;
      })
      .addCase(addScheduleSlot.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // DELETE SLOT
      .addCase(deleteScheduleSlot.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(deleteScheduleSlot.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload?.schedule) {
          state.schedule = action.payload.schedule;
        } else if (action.payload?.timeSlots) {
          if (state.schedule)
            state.schedule.timeSlots = action.payload.timeSlots;
        } else if (Array.isArray(action.payload)) {
          if (state.schedule) state.schedule.timeSlots = action.payload;
        }
      })
      .addCase(deleteScheduleSlot.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // DASHBOARD
      .addCase(fetchTeacherDashboard.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isPendingApproval = false;
      })
      .addCase(fetchTeacherDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboard = action.payload;
        state.isPendingApproval = false;
      })
      .addCase(fetchTeacherDashboard.rejected, (state, action) => {
        state.isLoading = false;
        if (action.payload?.status === "PENDING_APPROVAL") {
          state.isPendingApproval = true;
          state.pendingApprovalMessage = action.payload.message;
        } else {
          state.isError = true;
          state.message = action.payload?.message || "Failed to load dashboard";
        }
      })

      // BOOKINGS
      .addCase(fetchTeacherBookings.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchTeacherBookings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bookings = action.payload;
        state.isPendingApproval = false;
      })
      .addCase(fetchTeacherBookings.rejected, (state, action) => {
        state.isLoading = false;
        if (action.payload?.status === "PENDING_APPROVAL") {
          state.isPendingApproval = true;
          state.pendingApprovalMessage = action.payload.message;
        } else {
          state.isError = true;
          state.message = action.payload?.message || "Failed to load bookings";
        }
      })

      // ACCEPT BOOKING
      .addCase(acceptTeacherBooking.fulfilled, (state, action) => {
        state.message = "Booking accepted";
        const idx = state.bookings.findIndex(
          (b) => b._id === action.payload._id,
        );
        if (idx !== -1) {
          state.bookings[idx] = { ...state.bookings[idx], ...action.payload };
        }
      })

      // REJECT BOOKING
      .addCase(rejectTeacherBooking.fulfilled, (state, action) => {
        state.message = "Booking rejected";
        const idx = state.bookings.findIndex(
          (b) => b._id === action.payload._id,
        );
        if (idx !== -1) {
          state.bookings[idx] = { ...state.bookings[idx], ...action.payload };
        }
      })

      // COMPLETE CLASS
      .addCase(completeClassSession.fulfilled, (state, action) => {
        state.message = action.payload.message;
      })

      // WALLET
      .addCase(fetchTeacherWallet.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchTeacherWallet.fulfilled, (state, action) => {
        state.isLoading = false;
        state.wallet = action.payload;
        state.isPendingApproval = false;
      })
      .addCase(fetchTeacherWallet.rejected, (state, action) => {
        state.isLoading = false;
        if (action.payload?.status === "PENDING_APPROVAL") {
          state.isPendingApproval = true;
          state.pendingApprovalMessage = action.payload.message;
        } else {
          state.isError = true;
          state.message = action.payload?.message || "Failed to load wallet";
        }
      })

      // WITHDRAWAL
      .addCase(requestWithdrawal.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(requestWithdrawal.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = "Withdrawal request submitted";
        if (state.wallet) {
          state.wallet.withdrawals = [
            action.payload,
            ...(state.wallet.withdrawals || []),
          ];
        }
      })
      .addCase(requestWithdrawal.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // REVIEWS
      .addCase(fetchTeacherReviews.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchTeacherReviews.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reviewsData = action.payload;
        state.isPendingApproval = false;
      })
      .addCase(fetchTeacherReviews.rejected, (state, action) => {
        state.isLoading = false;
        if (action.payload?.status === "PENDING_APPROVAL") {
          state.isPendingApproval = true;
          state.pendingApprovalMessage = action.payload.message;
        } else {
          state.isError = true;
          state.message = action.payload?.message || "Failed to load reviews";
        }
      })

      // TRIALS
      .addCase(fetchTeacherTrials.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchTeacherTrials.fulfilled, (state, action) => {
        state.isLoading = false;
        state.trials = action.payload;
      })
      .addCase(fetchTeacherTrials.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(acceptTeacherTrial.fulfilled, (state, action) => {
        state.message = "Trial accepted successfully";
        const idx = (state.trials || []).findIndex(
          (t) => t._id === action.payload._id,
        );
        if (idx !== -1) {
          state.trials[idx] = { ...state.trials[idx], ...action.payload };
        }
      })
      .addCase(rejectTeacherTrial.fulfilled, (state, action) => {
        state.message = "Trial rejected";
        const idx = (state.trials || []).findIndex(
          (t) => t._id === action.payload._id,
        );
        if (idx !== -1) {
          state.trials[idx] = { ...state.trials[idx], ...action.payload };
        }
      })
      .addCase(cancelTeacherTrial.fulfilled, (state, action) => {
        state.message = "Trial cancelled";
        const idx = (state.trials || []).findIndex(
          (t) => t._id === action.payload._id,
        );
        if (idx !== -1) {
          state.trials[idx] = { ...state.trials[idx], ...action.payload };
        }
      })
      .addCase(completeTeacherTrial.fulfilled, (state, action) => {
        state.message = "Trial marked as completed";
        const idx = (state.trials || []).findIndex(
          (t) => t._id === action.payload._id,
        );
        if (idx !== -1) {
          state.trials[idx] = { ...state.trials[idx], ...action.payload };
        }
      });
  },
});

export const { resetTeacherState } = teacherSlice.actions;
export default teacherSlice.reducer;
