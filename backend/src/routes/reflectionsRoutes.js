const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const {
  getCurrentWeeklyReflectionContext,
  createWeeklyReflection,
  listReflections,
  updateReflection,
} = require("../controllers/reflectionsController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", listReflections);
router.get("/weekly/current", getCurrentWeeklyReflectionContext);
router.post("/weekly", createWeeklyReflection);
router.patch("/:id", updateReflection);

module.exports = router;
