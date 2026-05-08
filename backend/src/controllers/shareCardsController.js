const Reflection = require("../models/Reflection");
const ShareCard = require("../models/ShareCard");

async function createShareCard(req, res) {
  const userId = req.user._id;
  const { monthYear, showAmounts, showReflection } = req.body ?? {};

  if (!monthYear || !/^\d{4}-\d{2}$/.test(String(monthYear))) {
    return res.status(400).json({ message: "monthYear must be YYYY-MM." });
  }

  const reflection = await Reflection.findOne({
    userId,
    type: "monthly",
    period: String(monthYear),
  }).lean();
  if (!reflection) {
    return res.status(404).json({ message: "Monthly summary not found." });
  }

  const card = await ShareCard.create({
    userId,
    reflectionId: reflection._id,
    monthYear: String(monthYear),
    showAmounts: Boolean(showAmounts),
    showReflection: Boolean(showReflection),
    locale: req.user.locale === "ja" ? "ja" : "en",
  });

  return res.status(201).json({ cardId: String(card._id) });
}

async function getShareCardById(req, res) {
  const card = await ShareCard.findById(req.params.cardId).lean();
  if (!card) {
    return res.status(404).json({ message: "Share card not found." });
  }

  const reflection = await Reflection.findById(card.reflectionId).lean();
  if (!reflection || reflection.type !== "monthly") {
    return res.status(404).json({ message: "Share card source was not found." });
  }

  const payload = {
    cardId: String(card._id),
    monthYear: card.monthYear,
    showAmounts: card.showAmounts,
    showReflection: card.showReflection,
    locale: card.locale,
    summarySnapshot: reflection.summarySnapshot ?? null,
    monthlyAnswers: reflection.monthlyAnswers ?? [],
    createdAt: card.createdAt,
  };

  return res.status(200).json(payload);
}

module.exports = {
  createShareCard,
  getShareCardById,
};
