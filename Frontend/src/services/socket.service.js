import { io } from "socket.io-client";

let socket = null;

export const initSocketClient = (user) => {
  const token = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");
  const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL ||
    "https://s45mkq2p-3000.inc1.devtunnels.ms/";

  if (!token || !refreshToken || !user) {
    disconnectSocket();
    return null;
  }

  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      auth: {
        token,
      },
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      const uId = user?._id || user?.id;
      if (uId) {
        socket.emit("joinUser", { userId: uId, role: user?.role });
        if (
          user?.role === "admin" ||
          (Array.isArray(user?.role) && user.role.includes("admin"))
        ) {
          socket.emit("joinAdmin");
        }
      }
    });
  } else if (!socket.connected) {
    socket.connect();
  }

  const uId = user?._id || user?.id;
  if (uId && socket.connected) {
    socket.emit("joinUser", { userId: uId, role: user?.role });
    if (
      user?.role === "admin" ||
      (Array.isArray(user?.role) && user.role.includes("admin"))
    ) {
      socket.emit("joinAdmin");
    }
  }

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

if (typeof window !== "undefined") {
  window.addEventListener("darulameen:token-refreshed", (e) => {
    if (socket && e.detail?.accessToken) {
      socket.auth = { token: e.detail.accessToken };
    }
  });
}

export default {
  initSocketClient,
  getSocket,
  disconnectSocket,
};
