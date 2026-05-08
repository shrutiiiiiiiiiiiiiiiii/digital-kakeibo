const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const {
  getMonthlyCloseStatus,
  deferMonthlyClose,
  createMonthlyClose,
  listMonthlyArchive,
  getMonthlySummary,
} = require("../controllers/monthlyController");

const router = express.Router();

router.use(authMiddleware);

router.get("/status", getMonthlyCloseStatus);
router.post("/skip", deferMonthlyClose);
router.post("/close", createMonthlyClose);
router.get("/archive", listMonthlyArchive);
router.get("/:monthYear", getMonthlySummary);

module.exports = router;
