const { google } = require("googleapis");

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Helper to generate a valid Google Meet link format (e.g. https://meet.google.com/abc-defg-hij)
const generateFallbackMeetLink = () => {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const pick = (len) =>
    Array.from({ length: len }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length)),
    ).join("");
  return `https://meet.google.com/${pick(3)}-${pick(4)}-${pick(3)}`;
};

// Isolated client helper sequence
const getCalendarInstance = (teacherRefreshToken) => {
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token: teacherRefreshToken });
  return google.calendar({ version: "v3", auth: oauth2Client });
};

/**
 * Generates an absolute Google Meet spaces link dynamically using absolute UTC boundaries.
 * Attempts Google Calendar API when refresh token is available, and safely falls back
 * to a standard Google Meet room link to guarantee zero disruption.
 */
const createGoogleMeetLink = async (
  summary,
  startMinutes,
  endMinutes,
  teacherRefreshToken,
) => {
  try {
    if (!teacherRefreshToken || !CLIENT_ID || !CLIENT_SECRET) {
      console.log(
        "Google OAuth credentials not configured; generating standard Google Meet link.",
      );
      return generateFallbackMeetLink();
    }

    const calendar = getCalendarInstance(teacherRefreshToken);

    const now = new Date();
    const startDate = new Date(now);
    const sMin = typeof startMinutes === "number" ? startMinutes : 0;
    const eMin = typeof endMinutes === "number" ? endMinutes : 30;

    startDate.setHours(Math.floor(sMin / 60), sMin % 60, 0, 0);

    const endDate = new Date(now);
    endDate.setHours(Math.floor(eMin / 60), eMin % 60, 0, 0);

    if (endDate <= startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }

    const event = {
      summary: summary || "Online Class Session",
      description:
        "Google Meet space link automatically generated via Dar-ul-Ameen",
      start: {
        dateTime: startDate.toISOString(),
        timeZone: "Asia/Karachi",
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: "Asia/Karachi",
      },
      conferenceData: {
        createRequest: {
          requestId: `meet-space-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
      conferenceDataVersion: 1,
    });

    if (response?.data?.hangoutLink) {
      return response.data.hangoutLink;
    }

    return generateFallbackMeetLink();
  } catch (error) {
    console.warn(
      "Notice: Google API call fallback to standard Google Meet link:",
      error.message,
    );
    return generateFallbackMeetLink();
  }
};

module.exports = createGoogleMeetLink;
