const Entry = require("../models/Entry");
const Reflection = require("../models/Reflection");

const WEEKLY_PROMPTS = [
  "What surprised you this week?",
  "Which expense brought you the most joy?",
  "Was there something you bought that you regret?",
  "What did you NOT spend on that you're grateful for?",
  "Was there a moment you almost spent and chose not to? What stopped you?",
  "How did your spending match your values this week?",
];

function parseDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function pickPrompt(userId, period) {
  const seed = `${userId}:${period}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return WEEKLY_PROMPTS[hash % WEEKLY_PROMPTS.length];
}

async function computeSummarySnapshot(userId, fromDate, toDate) {
  const rows = await Entry.aggregate([
    {
      $match: {
        userId,
        date: { $gte: fromDate, $lte: toDate },
      },
    },
    {
      $group: {
        _id: "$category",
        total: { $sum: "$amount" },
      },
    },
  ]);

  const byCategory = { needs: 0, wants: 0, culture: 0, unexpected: 0 };
  let totalSpent = 0;
  for (const row of rows) {
    if (!byCategory.hasOwnProperty(row._id)) continue;
    byCategory[row._id] = row.total;
    totalSpent += row.total;
  }

  return { totalSpent, byCategory };
}

async function getCurrentWeeklyReflectionContext(req, res) {
  const userId = req.user._id;
  const baseCurrency = req.user?.settings?.baseCurrency ?? req.user?.settings?.currency ?? "JPY";
  const { period, from, to } = req.query;

  if (!period || !from || !to) {
    return res.status(400).json({ message: "period, from, and to are required" });
  }

  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  if (!fromDate || !toDate) {
    return res.status(400).json({ message: "Invalid date range" });
  }

  const existing = await Reflection.findOne({
    userId,
    type: "weekly",
    period,
  }).lean();

  const summarySnapshot = existing?.summarySnapshot
    ? existing.summarySnapshot
    : await computeSummarySnapshot(userId, fromDate, toDate);

  return res.status(200).json({
    period,
    currency: baseCurrency,
    prompt: existing?.prompt ?? pickPrompt(userId.toString(), String(period)),
    reflection: existing ?? null,
    summarySnapshot,
  });
}

async function createWeeklyReflection(req, res) {
  const userId = req.user._id;
  const { period, from, to, prompt, response, handwritingImage } = req.body ?? {};

  if (!period || !from || !to || !prompt) {
    return res.status(400).json({ message: "period, from, to and prompt are required" });
  }

  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  if (!fromDate || !toDate) {
    return res.status(400).json({ message: "Invalid date range" });
  }

  const text = String(response).trim();
  const handwriting = typeof handwritingImage === "string" ? handwritingImage.trim() : "";
  if (!text && !handwriting) {
    return res.status(400).json({ message: "Response or handwriting is required" });
  }
  if (text.length > 5000) {
    return res.status(400).json({ message: "Response too long" });
  }
  if (handwriting.length > 2_000_000) {
    return res.status(400).json({ message: "Handwriting image is too large" });
  }

  const exists = await Reflection.findOne({ userId, type: "weekly", period }).lean();
  if (exists) {
    return res.status(409).json({ message: "Reflection already exists for this week" });
  }

  const summarySnapshot = await computeSummarySnapshot(userId, fromDate, toDate);

  const reflection = await Reflection.create({
    userId,
    type: "weekly",
    period: String(period),
    prompt: String(prompt),
    response: text || "[Handwritten reflection]",
    handwritingImage: handwriting || null,
    summarySnapshot,
  });

  return res.status(201).json({ reflection });
}

async function listReflections(req, res) {
  const userId = req.user._id;
  const type = req.query.type === "monthly" ? "monthly" : "weekly";
  const reflections = await Reflection.find({ userId, type })
    .sort({ period: -1, createdAt: -1 })
    .lean();
  return res.status(200).json({ reflections });
}

async function updateReflection(req, res) {
  const userId = req.user._id;
  const reflection = await Reflection.findOne({ _id: req.params.id, userId });
  if (!reflection) {
    return res.status(404).json({ message: "Reflection not found" });
  }

  const ageMs = Date.now() - new Date(reflection.createdAt).getTime();
  const limitMs = 24 * 60 * 60 * 1000;
  if (ageMs > limitMs) {
    return res.status(403).json({ message: "Reflections can be edited only within 24 hours" });
  }

  const nextResponse = String(req.body?.response ?? "").trim();
  const handwriting = typeof req.body?.handwritingImage === "string" ? req.body.handwritingImage.trim() : "";
  if (!nextResponse && !handwriting) {
    return res.status(400).json({ message: "Response or handwriting is required" });
  }
  if (nextResponse.length > 5000) {
    return res.status(400).json({ message: "Response too long" });
  }
  if (handwriting.length > 2_000_000) {
    return res.status(400).json({ message: "Handwriting image is too large" });
  }

  reflection.response = nextResponse || "[Handwritten reflection]";
  reflection.handwritingImage = handwriting || null;
  await reflection.save();
  return res.status(200).json({ reflection });
}

module.exports = {
  WEEKLY_PROMPTS,
  getCurrentWeeklyReflectionContext,
  createWeeklyReflection,
  listReflections,
  updateReflection,
};
