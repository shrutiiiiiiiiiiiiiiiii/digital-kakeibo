const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { getWeeklyInsights } = require("../controllers/aiInsightsController");

const router = express.Router();

router.use(authMiddleware);

// Returns a short 4-line Gemini response.
router.get("/insights/weekly", getWeeklyInsights);

module.exports = router;

