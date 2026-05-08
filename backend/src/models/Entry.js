const mongoose = require("mongoose");

const { Schema } = mongoose;

const entrySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: "JPY" },
  category: {
    type: String,
    enum: ["needs", "wants", "culture", "unexpected"],
    required: true,
  },
  note: { type: String, maxLength: 200 },
  noteHandwritingImage: { type: String, default: null, maxLength: 2_000_000 },
  date: { type: Date, required: true, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

entrySchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model("Entry", entrySchema);
