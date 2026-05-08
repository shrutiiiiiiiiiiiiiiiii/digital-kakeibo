const Entry = require("../models/Entry");

function parseOptionalDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function normalizeNote(note) {
  if (note === undefined || note === null) return "";
  return String(note).trim();
}

const SUPPORTED_CURRENCIES = new Set([
  "JPY",
  "USD",
  "EUR",
  "GBP",
  "INR",
  "AUD",
  "CAD",
  "SGD",
  "AED",
  "CHF",
]);

function normalizeCurrency(value) {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  if (!SUPPORTED_CURRENCIES.has(code)) return null;
  return code;
}

async function listEntries(req, res) {
  const userId = req.user._id;
  const { from, to, category } = req.query;

  const filter = { userId };

  if (from || to) {
    filter.date = {};
    const fromDate = parseOptionalDate(from);
    const toDate = parseOptionalDate(to);

    if (from && !fromDate) {
      return res.status(400).json({ message: "Invalid from date" });
    }
    if (to && !toDate) {
      return res.status(400).json({ message: "Invalid to date" });
    }

    if (fromDate) filter.date.$gte = fromDate;
    if (toDate) filter.date.$lte = toDate;
  }

  if (category) {
    const allowed = ["needs", "wants", "culture", "unexpected"];
    if (!allowed.includes(category)) {
      return res.status(400).json({ message: "Invalid category filter" });
    }
    filter.category = category;
  }

  const entries = await Entry.find(filter).sort({ date: -1, createdAt: -1 }).lean();
  return res.status(200).json({ entries });
}

async function getEntry(req, res) {
  const userId = req.user._id;
  const entry = await Entry.findOne({ _id: req.params.id, userId }).lean();
  if (!entry) {
    return res.status(404).json({ message: "Entry not found" });
  }
  return res.status(200).json({ entry });
}

async function createEntry(req, res) {
  const userId = req.user._id;
  const { amount, category, currency, note, noteHandwritingImage, date } = req.body ?? {};

  if (amount === undefined || amount === null || category === undefined) {
    return res.status(400).json({ message: "Amount and category are required" });
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount < 0) {
    return res.status(400).json({ message: "Invalid amount" });
  }

  const allowed = ["needs", "wants", "culture", "unexpected"];
  if (!allowed.includes(category)) {
    return res.status(400).json({ message: "Invalid category" });
  }

  const noteText = normalizeNote(note);
  const noteImage = typeof noteHandwritingImage === "string" ? noteHandwritingImage.trim() : "";
  if (noteText.length > 200) {
    return res.status(400).json({ message: "Note is too long" });
  }
  if (noteImage.length > 2_000_000) {
    return res.status(400).json({ message: "Handwritten note is too large" });
  }

  const dateValue = parseOptionalDate(date) ?? new Date();
  const selectedCurrency =
    normalizeCurrency(currency) ??
    normalizeCurrency(req.user.settings?.baseCurrency) ??
    normalizeCurrency(req.user.settings?.currency) ??
    "JPY";

  const entry = await Entry.create({
    userId,
    amount: numericAmount,
    currency: selectedCurrency,
    category,
    note: noteText || undefined,
    noteHandwritingImage: noteImage || null,
    date: dateValue,
  });

  return res.status(201).json({ entry });
}

async function updateEntry(req, res) {
  const userId = req.user._id;
  const entry = await Entry.findOne({ _id: req.params.id, userId });
  if (!entry) {
    return res.status(404).json({ message: "Entry not found" });
  }

  const { amount, category, currency, note, noteHandwritingImage, date } = req.body ?? {};

  if (amount !== undefined) {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount < 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }
    entry.amount = numericAmount;
  }

  if (category !== undefined) {
    const allowed = ["needs", "wants", "culture", "unexpected"];
    if (!allowed.includes(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }
    entry.category = category;
  }

  if (currency !== undefined) {
    const selectedCurrency = normalizeCurrency(currency);
    if (!selectedCurrency) {
      return res.status(400).json({ message: "Invalid currency" });
    }
    entry.currency = selectedCurrency;
  }

  if (note !== undefined) {
    const noteText = normalizeNote(note);
    if (noteText.length > 200) {
      return res.status(400).json({ message: "Note is too long" });
    }
    entry.note = noteText || undefined;
  }

  if (noteHandwritingImage !== undefined) {
    const noteImage = typeof noteHandwritingImage === "string" ? noteHandwritingImage.trim() : "";
    if (noteImage.length > 2_000_000) {
      return res.status(400).json({ message: "Handwritten note is too large" });
    }
    entry.noteHandwritingImage = noteImage || null;
  }

  if (date !== undefined) {
    const dateValue = parseOptionalDate(date);
    if (!dateValue) {
      return res.status(400).json({ message: "Invalid date" });
    }
    entry.date = dateValue;
  }

  await entry.save();
  return res.status(200).json({ entry });
}

async function deleteEntry(req, res) {
  const userId = req.user._id;
  const entry = await Entry.findOneAndDelete({ _id: req.params.id, userId }).lean();
  if (!entry) {
    return res.status(404).json({ message: "Entry not found" });
  }
  return res.status(200).json({ ok: true, entry });
}

module.exports = {
  listEntries,
  getEntry,
  createEntry,
  updateEntry,
  deleteEntry,
};
