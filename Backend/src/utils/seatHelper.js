const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  // Handle AM/PM if present
  const trimmed = timeStr.trim();
  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const mins = parseInt(ampmMatch[2], 10);
    const meridiem = ampmMatch[3].toUpperCase();
    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    return hours * 60 + mins;
  }

  // Handle 24-hour format "HH:MM"
  const parts = trimmed.split(":");
  const hours = parseInt(parts[0], 10) || 0;
  const mins = parseInt(parts[1], 10) || 0;
  return hours * 60 + mins;
}

function minutesToTime(mins) {
  const normalized = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatTime12h(timeStr) {
  const totalMins = timeToMinutes(timeStr);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const period = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${String(m).padStart(2, "0")} ${period}`;
}

/**
 * Splits a slot into distinct seats based on duration.
 * Leftover rule: if remaining time is less than duration, it is discarded.
 */
function splitSlotIntoSeats(slot, duration) {
  if (!slot || !slot.startTime || !slot.endTime || !duration || duration <= 0) {
    return [];
  }

  const startMins = timeToMinutes(slot.startTime);
  const endMins = timeToMinutes(slot.endTime);
  const totalDuration = endMins - startMins;

  if (totalDuration < duration) {
    return [];
  }

  const numSeats = Math.floor(totalDuration / duration);
  const seats = [];

  for (let i = 0; i < numSeats; i++) {
    const seatStartMins = startMins + i * duration;
    const seatEndMins = seatStartMins + duration;
    seats.push({
      day: slot.day,
      startTime: minutesToTime(seatStartMins),
      endTime: minutesToTime(seatEndMins),
      duration,
    });
  }

  return seats;
}

/**
 * Calculates the next occurrence of a weekday from a reference date.
 */
function getNextDayOccurrence(dayName, fromDate = new Date()) {
  const targetDayIdx = dayNames.findIndex(
    (d) => d.toLowerCase() === dayName.toLowerCase(),
  );
  if (targetDayIdx === -1) return new Date(fromDate);

  const result = new Date(fromDate);
  result.setHours(0, 0, 0, 0);
  const currentDayIdx = result.getDay();

  let daysToAdd = (targetDayIdx - currentDayIdx + 7) % 7;
  // If today is target day, schedule for today if slot hasn't passed, or today itself
  result.setDate(result.getDate() + daysToAdd);
  return result;
}

/**
 * Checks if two time intervals overlap.
 */
function checkTimeOverlap(start1Str, end1Str, start2Str, end2Str) {
  const s1 = timeToMinutes(start1Str);
  const e1 = timeToMinutes(end1Str);
  const s2 = timeToMinutes(start2Str);
  const e2 = timeToMinutes(end2Str);
  return s1 < e2 && s2 < e1;
}

module.exports = {
  dayNames,
  timeToMinutes,
  minutesToTime,
  formatTime12h,
  splitSlotIntoSeats,
  getNextDayOccurrence,
  checkTimeOverlap,
};
