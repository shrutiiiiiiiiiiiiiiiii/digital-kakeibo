const mongoose = require("mongoose");

const { Schema } = mongoose;

const goalSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  monthYear: { type: String, required: true }, // YYYY-MM
  savingsTarget: { type: Number, required: true },
  achieved: { type: Number, default: 0 },
  reflectionId: { type: Schema.Types.ObjectId, ref: "Reflection" },
  createdAt: { type: Date, default: Date.now },
});

goalSchema.index({ userId: 1, monthYear: 1 }, { unique: true });

module.exports = mongoose.model("Goal", goalSchema);
