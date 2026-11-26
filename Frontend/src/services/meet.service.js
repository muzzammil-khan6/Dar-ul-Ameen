// Job: Encapsulates all 1v1 Meet link timing, countdowns, and live-class status calculation

export function timeToMinutes(time) {
  if (!time || typeof time !== "string") return 0;

  let timeStr = time.toLowerCase().trim();
  let isPM = timeStr.includes("pm");
  let isAM = timeStr.includes("am");

  timeStr = timeStr.replace(/am|pm/g, "").trim();
  let parts = timeStr.split(":").map(Number);
  let h = parts[0];
  let m = parts[1];
  if (isNaN(h) || isNaN(m)) return NaN;

  if (isPM && h !== 12) h += 12;

  if (isAM && h === 12) h = 0;

  return h * 60 + (m || 0);
}

export function getSlotDateTime(dateVal, time) {
  if (!dateVal) return new Date();
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return new Date();
  const totalMins = timeToMinutes(time);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  d.setHours(hours, mins, 0, 0);
  return d;
}

export function getCountdown(startDateTime, now = new Date()) {
  if (!startDateTime) return "";
  const start = new Date(startDateTime);
  const current = new Date(now);
  const diffMs = start.getTime() - current.getTime();

  if (diffMs <= 0) return "Class starting now";

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const mins = totalMinutes % 60;

  if (days > 0) {
    return `Class in ${days} day${days > 1 ? "s" : ""}, ${hours} hr${hours > 1 ? "s" : ""}, ${mins} min${mins !== 1 ? "s" : ""}`;
  }
  if (hours > 0) {
    return `Class in ${hours} hour${hours > 1 ? "s" : ""}, ${mins} min${mins !== 1 ? "s" : ""}`;
  }
  return `Class in ${mins} min${mins !== 1 ? "s" : ""}`;
}

export function getMeetTiming(
  dateVal,
  startTimeStr,
  endTimeStr,
  now = new Date(),
) {
  const current = new Date(now);
  const start = getSlotDateTime(dateVal, startTimeStr);
  let end = getSlotDateTime(dateVal, endTimeStr);

  // If end is before start, it crosses midnight into next day
  if (end.getTime() <= start.getTime()) {
    end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
  }

  // Grace period: allow joining 5 mins early
  const earlyStart = new Date(start.getTime() - 5 * 60 * 1000);

  const isLive = current >= earlyStart && current <= end;
  const isUpcoming = current < earlyStart;
  const isEnded = current > end;

  return {
    startDateTime: start,
    endDateTime: end,
    isLive,
    isUpcoming,
    isEnded,
    countdown: isUpcoming
      ? getCountdown(start, current)
      : isLive
        ? "Live now"
        : "Class ended",
  };
}
