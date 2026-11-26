import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://s45mkq2p-3000.inc1.devtunnels.ms/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise = null;

export const regenerateAccessToken = async () => {
  if (refreshPromise) return refreshPromise;

  const refreshToken =
    typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  refreshPromise = axios
    .post(
      `${API_BASE_URL}/auth/refreshToken`,
      { refreshToken },
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      },
    )
    .then((response) => {
      const newAccessToken = response.data?.accessToken;
      const newRefreshToken = response.data?.refreshToken;
      if (newAccessToken) {
        localStorage.setItem("accessToken", newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("darulameen:token-refreshed", {
              detail: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
              },
            }),
          );
        }
        return response.data;
      }
      throw new Error("Failed to receive new access token");
    })
    .catch((error) => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("darulameen:logout"));
      }
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

api.interceptors.request.use(
  async (config) => {
    let token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
    const refreshToken =
      typeof window !== "undefined"
        ? localStorage.getItem("refreshToken")
        : null;

    const isRefreshCall =
      config.url?.includes("/auth/refreshToken") ||
      config.url?.includes("/auth/refresh-token");

    // If access token is missing but user has a valid refresh token, regenerate it first
    if (!token && refreshToken && !isRefreshCall) {
      try {
        const refreshData = await regenerateAccessToken();
        token = refreshData?.accessToken;
      } catch (e) {
        // Proceed without token if refresh fails; response interceptor will handle 401
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    const isNonRefreshableAuth =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/refreshToken") ||
      originalRequest.url?.includes("/auth/refresh-token");

    if (error.response?.status === 401) {
      // If 401 is from login/register/refreshToken or request was already retried
      if (isNonRefreshableAuth || originalRequest._retry) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("darulameen:logout"));
        }
        return Promise.reject(error);
      }

      // Check if user has a refresh token
      const refreshToken =
        typeof window !== "undefined"
          ? localStorage.getItem("refreshToken")
          : null;

      if (!refreshToken) {
        // User lacks a refresh token -> log out immediately!
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("darulameen:logout"));
        }
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      try {
        const refreshData = await regenerateAccessToken();
        const newAccessToken = refreshData?.accessToken;
        if (newAccessToken) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
