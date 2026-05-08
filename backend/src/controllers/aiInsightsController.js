const Entry = require("../models/Entry");

function parseDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function buildFallbackInsight({ locale, baseCurrency, totalSpent, byCategory }) {
  const categories = ["needs", "wants", "culture", "unexpected"];
  const top = categories.reduce(
    (best, cat) => {
      const value = Number(byCategory?.[cat]?.total ?? 0);
      return value > best.value ? { cat, value } : best;
    },
    { cat: "needs", value: 0 }
  );
  const pct = totalSpent > 0 ? ((top.value / totalSpent) * 100).toFixed(1) : "0.0";

  if (locale === "ja") {
    return [
      `最大カテゴリ: ${top.cat} (${pct}%)`,
      `気づき: 今週は${top.cat}の比率が高めでした。`,
      `行動: 来週は${top.cat}に使う前に1分だけ見直しましょう。`,
      "問い: この支出は本当に今の自分の優先順位に合っていますか？",
    ].join("\n");
  }

  return [
    `Biggest category: ${top.cat} (${pct}%)`,
    `Insight: Your spending leaned heavily toward ${top.cat} this week.`,
    `Action: Pause for one minute before the next ${top.cat} purchase.`,
    "Question: Does this expense match your real priority right now?",
  ].join("\n");
}

function buildPrompt({
  locale,
  baseCurrency,
  from,
  to,
  totalSpent,
  byCategory,
}) {
  const cats = ["needs", "wants", "culture", "unexpected"];
  const total = totalSpent || 0;
  const parts = cats
    .map((cat) => {
      const v = Number(byCategory?.[cat]?.total ?? byCategory?.[cat] ?? 0);
      const pct = total > 0 ? (v / total) * 100 : 0;
      return `${cat}: ${v} (${pct.toFixed(1)}%)`;
    })
    .join("\n");

  if (locale === "ja") {
    return `あなたは家計コーチです。次の情報（ベース通貨: ${baseCurrency}）をもとに、今週の支出を短く振り返り、来週の小さな改善案を提案してください。\n\n期間: ${from} 〜 ${to}\n総支出: ${totalSpent}\n内訳:\n${parts}\n\n出力条件:\n- 4行で答えてください\n- 1行目: 最も大きいカテゴリ\n- 2行目: 1つの気づき（改善ポイント）\n- 3行目: 来週の具体的な行動\n- 4行目: 心に問いかける振り返り質問\n`;
  }

  return `You are a financial coach. Using the user's weekly spending data (base currency: ${baseCurrency}), write short insights and one small action for next week.\n\nPeriod: ${from} to ${to}\nTotal spent: ${totalSpent}\nBreakdown:\n${parts}\n\nOutput requirements:\n- Return exactly 4 lines\n- Line 1: biggest category\n- Line 2: one insight (what to adjust)\n- Line 3: one concrete action for next week\n- Line 4: a reflective question\n`;
}

async function callGemini({ apiKey, prompt }) {
  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 220,
    },
  };

  // Models/APIs evolve; try a few common combos for compatibility.
  const candidates = [
    { apiVersion: "v1", model: "gemini-2.5-flash" },
    { apiVersion: "v1", model: "gemini-2.5-flash-lite" },
    { apiVersion: "v1beta", model: "gemini-2.5-flash" },
    { apiVersion: "v1beta", model: "gemini-2.5-flash-lite" },
    { apiVersion: "v1", model: "gemini-2.0-flash" },
    { apiVersion: "v1beta", model: "gemini-2.0-flash" },
    { apiVersion: "v1", model: "gemini-1.5-flash" },
    { apiVersion: "v1beta", model: "gemini-1.5-flash" },
  ];

  let lastError = null;
  for (const c of candidates) {
    const endpoint = `https://generativelanguage.googleapis.com/${c.apiVersion}/models/${c.model}:generateContent?key=${encodeURIComponent(
      apiKey
    )}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const msg =
        typeof data?.error?.message === "string"
          ? data.error.message
          : `Gemini request failed with status ${response.status}`;

      // If model/version mismatch, try the next candidate.
      const lower = String(msg).toLowerCase();
      const isModelMismatch =
        lower.includes("not found") ||
        lower.includes("not supported") ||
        lower.includes("unsupported") ||
        lower.includes("models/");
      lastError = new Error(msg);
      if (isModelMismatch) continue;
      throw lastError;
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      lastError = new Error("Gemini returned no text.");
      continue;
    }
    return String(text).trim();
  }

  throw lastError ?? new Error("Gemini request failed.");
}

async function getWeeklyInsights(req, res) {
  const EntryControllerUserId = req.user._id;
  const { from, to } = req.query ?? {};

  if (!from || !to) {
    return res.status(400).json({ message: "from and to are required" });
  }

  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  if (!fromDate || !toDate) {
    return res.status(400).json({ message: "Invalid date range" });
  }

  const { geminiApiKey } = require("../config/env");
  if (!geminiApiKey) {
    return res.status(503).json({ message: "Gemini is not configured on the server." });
  }

  const rows = await Entry.aggregate([
    {
      $match: {
        userId: EntryControllerUserId,
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

  const byCategory = { needs: { total: 0 }, wants: { total: 0 }, culture: { total: 0 }, unexpected: { total: 0 } };
  let totalSpent = 0;
  for (const row of rows) {
    if (!byCategory[row._id]) continue;
    byCategory[row._id].total = Number(row.total ?? 0);
    totalSpent += Number(row.total ?? 0);
  }

  const baseCurrency = req.user?.settings?.baseCurrency ?? req.user?.settings?.currency ?? "JPY";
  const locale = req.user?.locale ?? "en";

  const prompt = buildPrompt({
    locale,
    baseCurrency,
    from,
    to,
    totalSpent,
    byCategory,
  });

  try {
    const rawInsight = await callGemini({ apiKey: geminiApiKey, prompt });
    const lines = rawInsight
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const compact = lines.slice(0, 4);
    const looksIncomplete =
      compact.length < 4 ||
      compact.some((line) => line.length < 12 || line.endsWith(":") || /^(insight|action|question)\s*:\s*$/i.test(line));

    const insight = looksIncomplete
      ? buildFallbackInsight({ locale, baseCurrency, totalSpent, byCategory })
      : compact.join("\n");

    return res.status(200).json({ insight, currency: baseCurrency, period: { from, to } });
  } catch (error) {
    // Surface a clearer error message to the client instead of a generic 500.
    const raw = error instanceof Error ? error.message : "Gemini request failed.";
    const message = `Gemini error: ${raw}`;

    const lower = String(raw).toLowerCase();
    if (lower.includes("quota") || lower.includes("rate limit") || lower.includes("exceeded your current quota")) {
      const match = String(raw).match(/retry in\s+(\d+(\.\d+)?)s/i);
      const retryAfterSeconds = match ? Number(match[1]) : null;
      if (retryAfterSeconds && Number.isFinite(retryAfterSeconds)) {
        res.set("Retry-After", String(Math.ceil(retryAfterSeconds)));
      }
      return res.status(429).json({ message, retryAfterSeconds });
    }

    return res.status(502).json({ message });
  }
}

module.exports = { getWeeklyInsights };

