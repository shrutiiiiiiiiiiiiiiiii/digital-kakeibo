const mongoose = require("mongoose");

const { Schema } = mongoose;

const reflectionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, enum: ["weekly", "monthly"], required: true },
  period: { type: String, required: true },
  prompt: { type: String, required: true },
  response: { type: String, required: true, maxLength: 5000 },
  handwritingImage: { type: String, default: null, maxLength: 2_000_000 },
  monthlyAnswers: [
    {
      questionEn: { type: String },
      questionJa: { type: String },
      answer: { type: String },
    },
  ],
  monthlyAnswerHandwritingImages: [{ type: String, maxLength: 2_000_000 }],
  summarySnapshot: {
    totalSpent: { type: Number, default: 0 },
    byCategory: {
      needs: { type: Number, default: 0 },
      wants: { type: Number, default: 0 },
      culture: { type: Number, default: 0 },
      unexpected: { type: Number, default: 0 },
    },
  },
  createdAt: { type: Date, default: Date.now },
});

reflectionSchema.index({ userId: 1, type: 1, period: 1 }, { unique: true });

module.exports = mongoose.model("Reflection", reflectionSchema);
