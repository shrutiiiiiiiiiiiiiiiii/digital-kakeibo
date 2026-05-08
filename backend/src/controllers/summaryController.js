const Entry = require("../models/Entry");

function parseDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

async function getWeekSummary(req, res) {
  const userId = req.user._id;
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ message: "from and to are required" });
  }

  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  if (!fromDate || !toDate) {
    return res.status(400).json({ message: "Invalid date range" });
  }

  const rows = await Entry.aggregate([
    {
      $match: {
        userId,
        date: { $gte: fromDate, $lte: toDate },
      },
    },
    {
      $group: {
        _id: { category: "$category", currency: "$currency" },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  function emptyByCategory() {
    return {
      needs: { total: 0, count: 0 },
      wants: { total: 0, count: 0 },
      culture: { total: 0, count: 0 },
      unexpected: { total: 0, count: 0 },
    };
  }

  const byCategory = emptyByCategory();
  const currencyMap = new Map();
  let totalSpent = 0;
  let totalCount = 0;

  for (const row of rows) {
    const category = row?._id?.category;
    const currency = row?._id?.currency || "JPY";
    if (!byCategory[category]) continue;

    byCategory[category].total += row.total;
    byCategory[category].count += row.count;
    totalSpent += row.total;
    totalCount += row.count;

    if (!currencyMap.has(currency)) {
      currencyMap.set(currency, {
        currency,
        totalSpent: 0,
        totalCount: 0,
        byCategory: emptyByCategory(),
      });
    }
    const bucket = currencyMap.get(currency);
    bucket.totalSpent += row.total;
    bucket.totalCount += row.count;
    bucket.byCategory[category].total += row.total;
    bucket.byCategory[category].count += row.count;
  }

  const byCurrency = Array.from(currencyMap.values()).sort((a, b) => {
    if (b.totalSpent !== a.totalSpent) return b.totalSpent - a.totalSpent;
    return a.currency.localeCompare(b.currency);
  });

  return res.status(200).json({
    period: { from: fromDate.toISOString(), to: toDate.toISOString() },
    totalSpent,
    totalCount,
    byCategory,
    byCurrency,
  });
}

module.exports = { getWeekSummary };
