const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const env = require("./config/env");
const { connectToDatabase } = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const entriesRoutes = require("./routes/entriesRoutes");
const reflectionsRoutes = require("./routes/reflectionsRoutes");
const summaryRoutes = require("./routes/summaryRoutes");
const monthlyRoutes = require("./routes/monthlyRoutes");
const shareCardsRoutes = require("./routes/shareCardsRoutes");
const aiRoutes = require("./routes/aiRoutes");
const { startWeeklyReminderJob } = require("./jobs/weeklyReminder");

const app = express();

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: "3mb" }));
app.use(express.urlencoded({ extended: true, limit: "3mb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/entries", entriesRoutes);
app.use("/api/reflections", reflectionsRoutes);
app.use("/api/summary", summaryRoutes);
app.use("/api/monthly", monthlyRoutes);
app.use("/api/share-cards", shareCardsRoutes);
app.use("/api/ai", aiRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err?.type === "entity.too.large") {
    return res.status(413).json({ message: "Uploaded handwriting is too large. Please write a shorter note." });
  }
  res.status(500).json({ message: "Internal server error" });
});

async function start() {
  await connectToDatabase();
  startWeeklyReminderJob();
  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
