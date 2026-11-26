import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api.service";

export const fetchAdminDashboard = createAsyncThunk(
  "admin/fetchDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/dashboard");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load admin stats",
      );
    }
  },
);

export const fetchAdminTeachers = createAsyncThunk(
  "admin/fetchTeachers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/teachers");
      return response.data.teachers;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch teachers",
      );
    }
  },
);

export const approveTeacher = createAsyncThunk(
  "admin/approveTeacher",
  async (teacherId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/teachers/${teacherId}/approve`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Teacher approval failed",
      );
    }
  },
);

export const rejectTeacher = createAsyncThunk(
  "admin/rejectTeacher",
  async (teacherId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/teachers/${teacherId}/reject`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Teacher rejection failed",
      );
    }
  },
);

export const toggleBlockTeacher = createAsyncThunk(
  "admin/toggleBlockTeacher",
  async (teacherId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/teachers/${teacherId}/block`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to toggle block status",
      );
    }
  },
);

export const fetchSubjects = createAsyncThunk(
  "admin/fetchSubjects",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/subjects");
      return response.data.subjects;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch subjects",
      );
    }
  },
);

export const createSubject = createAsyncThunk(
  "admin/createSubject",
  async (subjectData, { rejectWithValue }) => {
    try {
      const response = await api.post("/admin/subjects", subjectData);
      return response.data.subject;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create subject",
      );
    }
  },
);

export const updateSubject = createAsyncThunk(
  "admin/updateSubject",
  async ({ subjectId, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/subjects/${subjectId}`, data);
      return response.data.subject;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update subject",
      );
    }
  },
);

export const deleteSubject = createAsyncThunk(
  "admin/deleteSubject",
  async (subjectId, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/subjects/${subjectId}`);
      return subjectId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete subject",
      );
    }
  },
);

export const fetchRates = createAsyncThunk(
  "admin/fetchRates",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/rates");
      return response.data.rates;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch rates",
      );
    }
  },
);

export const fetchAdminBookings = createAsyncThunk(
  "admin/fetchBookings",
  async (statusFilter, { rejectWithValue }) => {
    try {
      const url =
        statusFilter && statusFilter !== "All"
          ? `/admin/bookings?status=${statusFilter.toLowerCase()}`
          : "/admin/bookings";
      const response = await api.get(url);
      return response.data.bookings;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch bookings",
      );
    }
  },
);

export const fetchAdminPayments = createAsyncThunk(
  "admin/fetchPayments",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/payments");
      return response.data.payments;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch payments",
      );
    }
  },
);

export const fetchAdminWithdraws = createAsyncThunk(
  "admin/fetchWithdraws",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/withdraws");
      return response.data.withdraws;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch withdraws",
      );
    }
  },
);

export const approveWithdraw = createAsyncThunk(
  "admin/approveWithdraw",
  async ({ id, adminNote }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/withdraws/${id}/approve`, {
        adminNote,
      });
      return response.data.withdraw;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to approve withdraw",
      );
    }
  },
);

export const rejectWithdraw = createAsyncThunk(
  "admin/rejectWithdraw",
  async ({ id, adminNote }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/withdraws/${id}/reject`, {
        adminNote,
      });
      return response.data.withdraw;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to reject withdraw",
      );
    }
  },
);

export const fetchSettings = createAsyncThunk(
  "admin/fetchSettings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/settings");
      return response.data.settings;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch settings",
      );
    }
  },
);

export const updateCommissionSettings = createAsyncThunk(
  "admin/updateCommission",
  async (settingsData, { rejectWithValue }) => {
    try {
      const response = await api.put(
        "/admin/settings/commission",
        settingsData,
      );
      return response.data.settings;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update commission",
      );
    }
  },
);

export const approveBookingPayment = createAsyncThunk(
  "admin/approveBookingPayment",
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await api.put(
        `/admin/bookings/${bookingId}/approve-payment`,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to approve payment",
      );
    }
  },
);

export const rejectBookingPayment = createAsyncThunk(
  "admin/rejectBookingPayment",
  async ({ bookingId, reason }, { rejectWithValue }) => {
    try {
      const response = await api.put(
        `/admin/bookings/${bookingId}/reject-payment`,
        { reason },
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to reject payment",
      );
    }
  },
);

export const fetchWalletRequests = createAsyncThunk(
  "admin/fetchWalletRequests",
  async (status, { rejectWithValue }) => {
    try {
      const url =
        status && status !== "All"
          ? `/admin/wallet-requests?status=${status}`
          : "/admin/wallet-requests";
      const response = await api.get(url);
      return response.data.requests;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch wallet requests",
      );
    }
  },
);

export const approveWalletRequest = createAsyncThunk(
  "admin/approveWalletRequest",
  async ({ id, adminNote }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/wallet-requests/${id}/approve`, {
        adminNote,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to approve wallet request",
      );
    }
  },
);

export const rejectWalletRequest = createAsyncThunk(
  "admin/rejectWalletRequest",
  async ({ id, adminNote }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/wallet-requests/${id}/reject`, {
        adminNote,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to reject wallet request",
      );
    }
  },
);

const initialState = {
  dashboard: null,
  teachers: [],
  subjects: [],
  rates: [],
  bookings: [],
  payments: [],
  withdraws: [],
  walletRequests: [],
  settings: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: "",
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    resetAdminState: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // DASHBOARD
      .addCase(fetchAdminDashboard.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchAdminDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboard = action.payload;
      })
      .addCase(fetchAdminDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // TEACHERS
      .addCase(fetchAdminTeachers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAdminTeachers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.teachers = action.payload;
      })
      .addCase(fetchAdminTeachers.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // APPROVE TEACHER
      .addCase(approveTeacher.fulfilled, (state, action) => {
        state.message = action.payload.message;
        const teacher = state.teachers.find(
          (t) => t._id === action.payload.user?.id,
        );
        if (teacher) {
          teacher.teachingStatus = "approved";
        }
      })

      // REJECT TEACHER
      .addCase(rejectTeacher.fulfilled, (state, action) => {
        state.message = action.payload.message;
        const teacher = state.teachers.find(
          (t) => t._id === action.payload.user?.id,
        );
        if (teacher) {
          teacher.teachingStatus = "rejected";
        }
      })

      // BLOCK/UNBLOCK
      .addCase(toggleBlockTeacher.fulfilled, (state, action) => {
        state.message = action.payload.message;
        const teacher = state.teachers.find(
          (t) => t._id === action.payload.teacher?.id,
        );
        if (teacher) {
          teacher.isBlocked = action.payload.teacher.isBlocked;
        }
      })

      // SUBJECTS
      .addCase(fetchSubjects.fulfilled, (state, action) => {
        state.subjects = action.payload;
      })
      .addCase(createSubject.fulfilled, (state, action) => {
        state.subjects.push(action.payload);
        state.message = "Subject added successfully";
      })
      .addCase(updateSubject.fulfilled, (state, action) => {
        const idx = state.subjects.findIndex(
          (s) => s._id === action.payload._id,
        );
        if (idx !== -1) {
          state.subjects[idx] = action.payload;
        }
        state.message = "Subject updated successfully";
      })
      .addCase(deleteSubject.fulfilled, (state, action) => {
        state.subjects = state.subjects.filter((s) => s._id !== action.payload);
      })

      // RATES
      .addCase(fetchRates.fulfilled, (state, action) => {
        state.rates = action.payload;
      })

      // BOOKINGS
      .addCase(fetchAdminBookings.fulfilled, (state, action) => {
        state.bookings = action.payload;
      })

      // PAYMENTS
      .addCase(fetchAdminPayments.fulfilled, (state, action) => {
        state.payments = action.payload;
      })

      // WITHDRAWS
      .addCase(fetchAdminWithdraws.fulfilled, (state, action) => {
        state.withdraws = action.payload;
      })
      .addCase(approveWithdraw.fulfilled, (state, action) => {
        state.message = "Withdraw approved";
        const idx = state.withdraws.findIndex(
          (w) => w._id === action.payload._id,
        );
        if (idx !== -1) {
          state.withdraws[idx] = action.payload;
        }
      })
      .addCase(rejectWithdraw.fulfilled, (state, action) => {
        state.message = "Withdraw rejected";
        const idx = state.withdraws.findIndex(
          (w) => w._id === action.payload._id,
        );
        if (idx !== -1) {
          state.withdraws[idx] = action.payload;
        }
      })

      // SETTINGS
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      })
      .addCase(updateCommissionSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
        state.message = "Commission settings updated";
      })

      // BOOKING PAYMENT APPROVAL / REJECTION
      .addCase(approveBookingPayment.fulfilled, (state, action) => {
        const updatedBooking = action.payload.booking;
        if (updatedBooking) {
          state.bookings = state.bookings.map((b) =>
            b._id === updatedBooking._id ? { ...b, ...updatedBooking } : b,
          );
        }
        state.message = action.payload.message || "Payment approved";
      })
      .addCase(rejectBookingPayment.fulfilled, (state, action) => {
        const updatedBooking = action.payload.booking;
        if (updatedBooking) {
          state.bookings = state.bookings.map((b) =>
            b._id === updatedBooking._id ? { ...b, ...updatedBooking } : b,
          );
        }
        state.message = action.payload.message || "Payment rejected";
      })

      // WALLET TOPUP REQUESTS
      .addCase(fetchWalletRequests.fulfilled, (state, action) => {
        state.walletRequests = action.payload;
      })
      .addCase(approveWalletRequest.fulfilled, (state, action) => {
        const updatedTopup = action.payload.topup;
        if (updatedTopup) {
          state.walletRequests = state.walletRequests.map((r) =>
            r._id === updatedTopup._id ? { ...r, ...updatedTopup } : r,
          );
        }
        state.message = "Topup request approved";
      })
      .addCase(rejectWalletRequest.fulfilled, (state, action) => {
        const updatedTopup = action.payload.topup;
        if (updatedTopup) {
          state.walletRequests = state.walletRequests.map((r) =>
            r._id === updatedTopup._id ? { ...r, ...updatedTopup } : r,
          );
        }
        state.message = "Topup request rejected";
      });
  },
});

export const { resetAdminState } = adminSlice.actions;
export default adminSlice.reducer;
