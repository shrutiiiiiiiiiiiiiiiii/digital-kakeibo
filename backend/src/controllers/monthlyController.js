const Entry = require("../models/Entry");
const Reflection = require("../models/Reflection");
const Goal = require("../models/Goal");
const User = require("../models/User");

const MONTHLY_QUESTIONS = [
  {
    en: "What spending choice are you most proud of this month?",
    ja: "今月、いちばん良かったお金の使い方は？",
  },
  {
    en: "Where did your spending drift from your intention?",
    ja: "意図からズレた支出はどこでしたか？",
  },
  {
    en: "What pattern do you want to carry into next month?",
    ja: "来月に持ち越したい支出パターンは？",
  },
  {
    en: "What one small rule will guide your next month?",
    ja: "来月のために決める小さなルールは？",
  },
];

function toMonthYear(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function previousMonthYear(now) {
  return toMonthYear(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)));
}

function nextMonthYear(monthYear) {
  const [yearText, monthText] = monthYear.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const next = new Date(Date.UTC(year, month, 1));
  return toMonthYear(next);
}

function monthRangeUtc(monthYear) {
  const [yearText, monthText] = monthYear.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const from = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
  const to = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0, 0));
  return { from, to };
}

async function buildMonthSnapshot(userId, monthYear) {
  const { from, to } = monthRangeUtc(monthYear);
  const entries = await Entry.find({
    userId,
    date: { $gte: from, $lt: to },
  }).lean();

  const totalSpent = entries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const byCategory = entries.reduce((acc, entry) => {
    const cat = entry.category;
    if (!acc[cat]) acc[cat] = { total: 0, count: 0 };
    acc[cat].total += Number(entry.amount || 0);
    acc[cat].count += 1;
    return acc;
  }, {});

  return {
    totalSpent,
    entryCount: entries.length,
    byCategory,
    fromUtc: from.toISOString(),
    toUtc: to.toISOString(),
  };
}

async function getMonthlyCloseStatus(req, res) {
  const userId = req.user?._id;
  const now = req.query.now ? new Date(req.query.now) : new Date();
  if (Number.isNaN(now.getTime())) {
    return res.status(400).json({ message: "Invalid now value." });
  }

  if (now.getUTCDate() < 1) {
    return res.status(200).json({ shouldPrompt: false });
  }

  const targetMonthYear = previousMonthYear(now);
  const existing = await Reflection.findOne({
    userId,
    type: "monthly",
    period: targetMonthYear,
  }).lean();
  if (existing) {
    return res.status(200).json({ shouldPrompt: false, targetMonthYear, reason: "already_completed" });
  }

  const user = await User.findById(userId).lean();
  const deferredUntil = user?.settings?.monthlyPromptDeferredUntil
    ? new Date(user.settings.monthlyPromptDeferredUntil)
    : null;
  if (deferredUntil && deferredUntil > now) {
    return res.status(200).json({
      shouldPrompt: false,
      targetMonthYear,
      reason: "deferred",
      deferredUntil: deferredUntil.toISOString(),
    });
  }

  return res.status(200).json({
    shouldPrompt: true,
    targetMonthYear,
    questions: MONTHLY_QUESTIONS,
  });
}

async function deferMonthlyClose(req, res) {
  const userId = req.user?._id;
  const { targetMonthYear } = req.body ?? {};
  if (!targetMonthYear || !/^\d{4}-\d{2}$/.test(targetMonthYear)) {
    return res.status(400).json({ message: "targetMonthYear must be YYYY-MM." });
  }

  const existing = await Reflection.findOne({
    userId,
    type: "monthly",
    period: targetMonthYear,
  }).lean();
  if (existing) {
    return res.status(400).json({ message: "Monthly close already completed." });
  }

  const deferredUntil = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  await User.findByIdAndUpdate(userId, {
    $set: { "settings.monthlyPromptDeferredUntil": deferredUntil },
  });

  return res.status(200).json({ ok: true, deferredUntil: deferredUntil.toISOString() });
}

async function createMonthlyClose(req, res) {
  const userId = req.user?._id;
  const baseCurrency = req.user?.settings?.baseCurrency ?? req.user?.settings?.currency ?? "JPY";
  const { targetMonthYear, answers, handwritingAnswers, income, savingsTarget } = req.body ?? {};

  if (!targetMonthYear || !/^\d{4}-\d{2}$/.test(targetMonthYear)) {
    return res.status(400).json({ message: "targetMonthYear must be YYYY-MM." });
  }
  if (!Array.isArray(answers) || answers.length !== 4) {
    return res.status(400).json({ message: "answers must be an array of 4 strings." });
  }
  const handwriting = Array.isArray(handwritingAnswers) ? handwritingAnswers : ["", "", "", ""];
  if (!Array.isArray(handwriting) || handwriting.length !== 4) {
    return res.status(400).json({ message: "handwritingAnswers must be an array of 4 strings." });
  }
  const normalizedAnswers = answers.map((a) => (typeof a === "string" ? a.trim() : ""));
  const normalizedHandwriting = handwriting.map((a) => (typeof a === "string" ? a.trim() : ""));
  const hasInvalid = normalizedAnswers.some((text, idx) => !text && !normalizedHandwriting[idx]);
  if (hasInvalid) {
    return res.status(400).json({ message: "Each question requires typed text or handwriting." });
  }
  if (normalizedHandwriting.some((img) => img.length > 2_000_000)) {
    return res.status(400).json({ message: "Handwriting image is too large." });
  }
  const incomeValue = Number(income);
  const savingsTargetValue = Number(savingsTarget);
  if (!Number.isFinite(incomeValue) || incomeValue < 0) {
    return res.status(400).json({ message: "income must be a valid non-negative number." });
  }
  if (!Number.isFinite(savingsTargetValue) || savingsTargetValue < 0) {
    return res.status(400).json({ message: "savingsTarget must be a valid non-negative number." });
  }

  const existing = await Reflection.findOne({
    userId,
    type: "monthly",
    period: targetMonthYear,
  }).lean();
  if (existing) {
    return res.status(400).json({ message: "Monthly close already exists for this period." });
  }

  const summarySnapshot = await buildMonthSnapshot(userId, targetMonthYear);
  const achieved = incomeValue - summarySnapshot.totalSpent;
  const nextMonth = nextMonthYear(targetMonthYear);

  const reflection = await Reflection.create({
    userId,
    type: "monthly",
    period: targetMonthYear,
    prompt: "Monthly close ritual",
    response: normalizedAnswers
      .map((ans, idx) => `${idx + 1}. ${ans || "[Handwritten answer]"}`)
      .join("\n"),
    monthlyAnswers: normalizedAnswers.map((answer, index) => ({
      questionEn: MONTHLY_QUESTIONS[index].en,
      questionJa: MONTHLY_QUESTIONS[index].ja,
      answer: answer || "[Handwritten answer]",
    })),
    monthlyAnswerHandwritingImages: normalizedHandwriting,
    summarySnapshot: {
      ...summarySnapshot,
      currency: baseCurrency,
      income: incomeValue,
      savingsTarget: savingsTargetValue,
    },
  });

  const goal = await Goal.findOneAndUpdate(
    { userId, monthYear: nextMonth },
    {
      $set: {
        savingsTarget: savingsTargetValue,
        achieved,
        reflectionId: reflection._id,
      },
      $setOnInsert: {
        userId,
        monthYear: nextMonth,
        createdAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  await User.findByIdAndUpdate(userId, {
    $set: { "settings.monthlyPromptDeferredUntil": null },
  });

  return res.status(201).json({ reflection, goal });
}

async function listMonthlyArchive(req, res) {
  const userId = req.user?._id;
  const reflections = await Reflection.find({
    userId,
    type: "monthly",
  })
    .sort({ period: -1 })
    .lean();
  return res.status(200).json({ reflections });
}

async function getMonthlySummary(req, res) {
  const userId = req.user?._id;
  const { monthYear } = req.params;
  if (!monthYear || !/^\d{4}-\d{2}$/.test(monthYear)) {
    return res.status(400).json({ message: "Invalid month format." });
  }

  const reflection = await Reflection.findOne({
    userId,
    type: "monthly",
    period: monthYear,
  }).lean();

  if (!reflection) {
    return res.status(404).json({ message: "Monthly close not found." });
  }

  const goal = await Goal.findOne({
    userId,
    monthYear: nextMonthYear(monthYear),
  }).lean();

  return res.status(200).json({ reflection, goal });
}

module.exports = {
  getMonthlyCloseStatus,
  deferMonthlyClose,
  createMonthlyClose,
  listMonthlyArchive,
  getMonthlySummary,
};
