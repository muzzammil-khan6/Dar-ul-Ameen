const Rate = require("../models/rate.model");
const Settings = require("../models/settings.model");
const Subject = require("../models/subject.model");

// In-memory cache with 5-minute TTL for lightning-fast rate calculations
let rateCache = new Map();
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function refreshRateCache() {
  const now = Date.now();
  if (rateCache.size > 0 && now - cacheTimestamp < CACHE_TTL_MS) {
    return;
  }
  try {
    const [allRates, allSubjects] = await Promise.all([
      Rate.find({}).lean(),
      Subject.find({}).lean(),
    ]);

    const newMap = new Map();
    for (const s of allSubjects) {
      if (s.name) {
        newMap.set(s.name.toLowerCase().trim(), s.weeklyFullRate || 7000);
      }
    }
    for (const r of allRates) {
      if (r.subjectName && r.weeklyFullRate) {
        newMap.set(r.subjectName.toLowerCase().trim(), r.weeklyFullRate);
      }
    }
    rateCache = newMap;
    cacheTimestamp = now;
  } catch (err) {
    console.error("Error refreshing rate cache:", err.message);
  }
}

/**
 * Invalidate pricing cache when admin updates rates or subjects
 */
function invalidateRateCache() {
  rateCache.clear();
  cacheTimestamp = 0;
}

/**
 * Calculate rate for teacher based on Admin Rate on a Monthly basis (4 weeks of classes)
 * Weekly Formula: (Admin Rate / 7) * Days Per Week * (Duration / 60)
 * Monthly Formula: Weekly Rate * 4
 */
async function calculateRateForSubject(subjectName, daysPerWeek, duration) {
  await refreshRateCache();
  const key = (subjectName || "").toLowerCase().trim();
  const weeklyFull = rateCache.get(key) || 7000;

  const weeklyRate = (weeklyFull / 7) * daysPerWeek * (duration / 60);
  return Math.round(weeklyRate * 4);
}

async function calculateWeeklyRateForSubject(subjectName, daysPerWeek, duration) {
  await refreshRateCache();
  const key = (subjectName || "").toLowerCase().trim();
  const weeklyFull = rateCache.get(key) || 7000;

  return Math.round((weeklyFull / 7) * daysPerWeek * (duration / 60));
}

let cachedSettings = null;
let settingsCacheTimestamp = 0;

/**
 * Get current platform commission settings (cached for 5 minutes)
 */
async function getCommissionSettings() {
  const now = Date.now();
  if (cachedSettings && now - settingsCacheTimestamp < CACHE_TTL_MS) {
    return cachedSettings;
  }

  let settings = await Settings.findOne().lean();
  if (!settings) {
    settings = await Settings.create({
      commissionPercentage: 20,
      platformName: "Dar-ul-Ameen Tutor Platform",
      minWithdrawal: 500,
    });
  }
  cachedSettings = settings;
  settingsCacheTimestamp = now;
  return settings;
}

function invalidateSettingsCache() {
  cachedSettings = null;
  settingsCacheTimestamp = 0;
}

/**
 * Calculate commission breakdown
 */
function calculateCommission(totalPrice, commissionPercentage = 20) {
  const commission = Math.round(totalPrice * (commissionPercentage / 100));
  const teacherShare = totalPrice - commission;
  return { commission, teacherShare };
}

module.exports = {
  calculateRateForSubject,
  calculateWeeklyRateForSubject,
  getCommissionSettings,
  calculateCommission,
  invalidateRateCache,
  invalidateSettingsCache,
};
