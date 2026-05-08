const mongoose = require("mongoose");

const { Schema } = mongoose;

const shareCardSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  reflectionId: { type: Schema.Types.ObjectId, ref: "Reflection", required: true, index: true },
  monthYear: { type: String, required: true, index: true },
  showAmounts: { type: Boolean, default: false },
  showReflection: { type: Boolean, default: false },
  locale: { type: String, enum: ["en", "ja"], default: "en" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ShareCard", shareCardSchema);
