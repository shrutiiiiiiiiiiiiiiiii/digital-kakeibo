const cron = require("node-cron");
const Reflection = require("../models/Reflection");
const User = require("../models/User");
const { WEEKLY_PROMPTS } = require("../controllers/reflectionsController");
const { sendWeeklyReminderEmail } = require("../services/email");

function weekPeriodFromDate(date) {
  // ISO week period: YYYY-W##
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const diff = target - firstThursday;
  const week = 1 + Math.round(diff / (7 * 24 * 3600 * 1000));
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function getLocalDayHour(now, timeZone) {
  const dateStr = now.toLocaleString("en-US", { timeZone });
  const local = new Date(dateStr);
  return { day: local.getDay(), hour: local.getHours() };
}

function pickPrompt(userId, period) {
  const seed = `${userId}:${period}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return WEEKLY_PROMPTS[hash % WEEKLY_PROMPTS.length];
}

async function runWeeklyReminderSweep() {
  const now = new Date();
  const users = await User.find({
    "settings.emailRemindersEnabled": { $ne: false },
  }).lean();

  for (const user of users) {
    const timeZone = user.settings?.timeZone || "UTC";
    const weeklyReminderDay = user.settings?.weeklyReminderDay ?? 0;
    const { day, hour } = getLocalDayHour(now, timeZone);
    if (day !== weeklyReminderDay || hour !== 19) continue;

    const period = weekPeriodFromDate(now);
    const hasReflection = await Reflection.findOne({
      userId: user._id,
      type: "weekly",
      period,
    }).lean();
    if (hasReflection) continue;

    const prompt = pickPrompt(String(user._id), period);
    await sendWeeklyReminderEmail({ email: user.email, prompt });
  }
}

function startWeeklyReminderJob() {
  const enabled = process.env.ENABLE_WEEKLY_REMINDER_JOB === "true";
  if (!enabled) return;

  cron.schedule("0 * * * *", async () => {
    try {
      await runWeeklyReminderSweep();
    } catch (error) {
      console.error("[weekly-reminder-job] failed", error);
    }
  });
}

module.exports = { startWeeklyReminderJob, runWeeklyReminderSweep };
