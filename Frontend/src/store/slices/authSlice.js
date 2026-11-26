import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { regenerateAccessToken } from "../../services/api.service";

export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/login", credentials);
      if (response.data.accessToken) {
        localStorage.setItem("accessToken", response.data.accessToken);
      }
      if (response.data.refreshToken) {
        localStorage.setItem("refreshToken", response.data.refreshToken);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to log in",
      );
    }
  },
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/register", userData);
      if (response.data.accessToken) {
        localStorage.setItem("accessToken", response.data.accessToken);
      }
      if (response.data.refreshToken) {
        localStorage.setItem("refreshToken", response.data.refreshToken);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Registration failed",
      );
    }
  },
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await api.post("/auth/logout");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      return null;
    } catch (error) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      return rejectWithValue(error.response?.data?.message || "Logout failed");
    }
  },
);

export const logoutAllDevices = createAsyncThunk(
  "auth/logoutAll",
  async (_, { rejectWithValue }) => {
    try {
      await api.post("/auth/logoutAll");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      return null;
    } catch (error) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      return rejectWithValue(
        error.response?.data?.message || "Logout all failed",
      );
    }
  },
);

export const getMyProfile = createAsyncThunk(
  "auth/myProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/auth/my-profile");
      return response.data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load profile",
      );
    }
  },
);

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await api.put("/auth/profile", profileData);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update profile",
      );
    }
  },
);

export const changeActiveRole = createAsyncThunk(
  "auth/changeRole",
  async (role, { rejectWithValue }) => {
    try {
      const response = await api.put("/auth/change-role", { role });
      if (response.data.accessToken) {
        localStorage.setItem("accessToken", response.data.accessToken);
      }
      if (response.data.refreshToken) {
        localStorage.setItem("refreshToken", response.data.refreshToken);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to change role",
      );
    }
  },
);

export const refreshAccessToken = createAsyncThunk(
  "auth/refreshToken",
  async (_, { rejectWithValue }) => {
    try {
      const data = await regenerateAccessToken();
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to regenerate access token",
      );
    }
  },
);

const getSavedTempGoogle = () => {
  try {
    const saved = sessionStorage.getItem("tempGoogleAuth");
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
};

const getInitialToken = () => {
  try {
    const access = localStorage.getItem("accessToken");
    return access || null;
  } catch (e) {
    return null;
  }
};

const initialState = {
  user: null,
  token: getInitialToken(),
  tempGoogleAuth: getSavedTempGoogle(),
  activeRole: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: "",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    resetAuthState: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    },
    setAuthToken: (state, action) => {
      const newAccess = action.payload?.accessToken;
      const newRefresh = action.payload?.refreshToken;
      if (newAccess) {
        state.token = newAccess;
        localStorage.setItem("accessToken", newAccess);
      }
      if (newRefresh) {
        localStorage.setItem("refreshToken", newRefresh);
      }
    },
    forceLogout: (state) => {
      state.user = null;
      state.token = null;
      state.activeRole = null;
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      try {
        sessionStorage.removeItem("tempGoogleAuth");
      } catch (e) {}
    },
    setTempGoogleAuth: (state, action) => {
      state.tempGoogleAuth = action.payload;
      try {
        sessionStorage.setItem(
          "tempGoogleAuth",
          JSON.stringify(action.payload),
        );
      } catch (e) {}
    },
    clearTempGoogleAuth: (state) => {
      state.tempGoogleAuth = null;
      try {
        sessionStorage.removeItem("tempGoogleAuth");
      } catch (e) {}
    },
  },
  extraReducers: (builder) => {
    builder
      // REHYDRATE FROM REDUX-PERSIST
      .addCase("persist/REHYDRATE", (state, action) => {
        const payload = action.payload?.auth;
        const storedAccessToken =
          typeof window !== "undefined"
            ? localStorage.getItem("accessToken")
            : null;
        const storedRefreshToken =
          typeof window !== "undefined"
            ? localStorage.getItem("refreshToken")
            : null;

        // If user lacks BOTH access token and refresh token, ensure unauthenticated state
        if (!storedAccessToken && !storedRefreshToken) {
          state.user = null;
          state.token = null;
          state.activeRole = null;
          state.isLoading = false;
          state.isSuccess = false;
          state.isError = false;
          state.message = "";
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        } else if (payload) {
          state.user = payload.user;
          state.token = storedAccessToken || null;
          state.activeRole = payload.activeRole;
        }
      })

      // LOGIN
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = "";
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload.user;
        state.activeRole = action.payload.user?.role;
        state.token = action.payload.accessToken;
        state.message = action.payload.message || "Logged in successfully";
        if (action.payload.accessToken) {
          localStorage.setItem("accessToken", action.payload.accessToken);
        }
        if (action.payload.refreshToken) {
          localStorage.setItem("refreshToken", action.payload.refreshToken);
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // REGISTER
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = "";
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload.user;
        state.activeRole = action.payload.user?.role;
        state.token = action.payload.accessToken || null;
        state.message = action.payload.message || "Registration completed";
        if (action.payload.accessToken) {
          localStorage.setItem("accessToken", action.payload.accessToken);
        }
        if (action.payload.refreshToken) {
          localStorage.setItem("refreshToken", action.payload.refreshToken);
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // LOGOUT
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.activeRole = null;
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;
        state.message = "Logged out";
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      })
      .addCase(logoutUser.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.activeRole = null;
        state.isLoading = false;
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      })
      .addCase(logoutAllDevices.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.activeRole = null;
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;
        state.message = "Logged out from all sessions";
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      })
      .addCase(logoutAllDevices.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.activeRole = null;
        state.isLoading = false;
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      })

      // REFRESH TOKEN
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.token = action.payload.accessToken;
        state.isError = false;
      })
      .addCase(refreshAccessToken.rejected, (state, action) => {
        state.user = null;
        state.token = null;
        state.activeRole = null;
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Session expired";
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      })

      // PROFILE
      .addCase(getMyProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.activeRole = action.payload.role;
      })
      .addCase(getMyProfile.rejected, (state, action) => {
        const storedRefreshToken =
          typeof window !== "undefined"
            ? localStorage.getItem("refreshToken")
            : null;
        // If there's still a refresh token present, allow refresh to resolve before clearing user
        if (!storedRefreshToken) {
          state.user = null;
          state.token = null;
          state.activeRole = null;
          state.isLoading = false;
          state.isError = true;
          state.message = action.payload || "Session expired";
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        }
      })

      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload;
        state.message = "Profile updated successfully";
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // CHANGE ROLE
      .addCase(changeActiveRole.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
      })
      .addCase(changeActiveRole.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload.user;
        state.activeRole = action.payload.user.role;
        state.token = action.payload.accessToken;
        state.message = action.payload.message || "Role changed successfully";
      })
      .addCase(changeActiveRole.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const {
  resetAuthState,
  forceLogout,
  setAuthToken,
  setTempGoogleAuth,
  clearTempGoogleAuth,
} = authSlice.actions;
export default authSlice.reducer;
