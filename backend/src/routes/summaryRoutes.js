const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { getWeekSummary } = require("../controllers/summaryController");

const router = express.Router();

router.use(authMiddleware);
router.get("/week", getWeekSummary);

module.exports = router;
