const mongoose = require("mongoose");

const { Schema } = mongoose;

const userSchema = new Schema({
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  locale: { type: String, enum: ["en", "ja"], default: "en" },
  createdAt: { type: Date, default: Date.now },
  onboardingCompleted: { type: Boolean, default: false },
  onboardingCompletedAt: { type: Date, default: null },
  settings: {
    weeklyReminderDay: { type: Number, default: 0 },
    currency: { type: String, default: "JPY" },
    baseCurrency: { type: String, default: "JPY" },
    timeZone: { type: String, default: "UTC" },
    emailRemindersEnabled: { type: Boolean, default: true },
    monthlyPromptDeferredUntil: { type: Date, default: null },
  },
});

module.exports = mongoose.model("User", userSchema);
