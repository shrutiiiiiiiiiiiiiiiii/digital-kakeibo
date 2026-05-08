const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { createShareCard, getShareCardById } = require("../controllers/shareCardsController");

const router = express.Router();

router.get("/:cardId", getShareCardById);
router.post("/", authMiddleware, createShareCard);

module.exports = router;
