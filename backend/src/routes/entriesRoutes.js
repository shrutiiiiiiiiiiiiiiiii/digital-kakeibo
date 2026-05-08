const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const {
  listEntries,
  getEntry,
  createEntry,
  updateEntry,
  deleteEntry,
} = require("../controllers/entriesController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", listEntries);
router.post("/", createEntry);
router.get("/:id", getEntry);
router.patch("/:id", updateEntry);
router.delete("/:id", deleteEntry);

module.exports = router;
