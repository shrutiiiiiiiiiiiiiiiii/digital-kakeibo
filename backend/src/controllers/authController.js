const bcrypt = require("bcrypt");
const User = require("../models/User");
const Entry = require("../models/Entry");
const env = require("../config/env");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../utils/tokens");
const { sendWelcomeEmail } = require("../services/email");

const REFRESH_COOKIE_NAME = "refreshToken";
const PASSWORD_REGEX = /^(?=.*\d).{8,}$/;
const CURRENCY_REGEX = /^[A-Z]{3}$/;

function publicUser(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    locale: user.locale,
    onboardingCompleted: Boolean(user.onboardingCompleted),
    onboardingCompletedAt: user.onboardingCompletedAt,
    settings: user.settings,
    createdAt: user.createdAt,
  };
}

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: "lax",
  });
}

async function signup(req, res) {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  if (!PASSWORD_REGEX.test(password)) {
    return res.status(400).json({ message: "Password must be 8+ chars and include a number" });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: "Email already in use" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ email: email.toLowerCase(), passwordHash });
  sendWelcomeEmail({ email: user.email }).catch((error) => {
    console.error("Failed to send welcome email", error);
  });

  const accessToken = signAccessToken({ userId: user._id.toString() });
  const refreshToken = signRefreshToken({ userId: user._id.toString() });
  setRefreshCookie(res, refreshToken);

  return res.status(201).json({ user: publicUser(user), accessToken });
}

async function updateOnboarding(req, res) {
  const updates = {};
  const set = req.body ?? {};

  if (set.locale === "en" || set.locale === "ja") {
    updates.locale = set.locale;
  }
  const requestedCurrency = typeof set.baseCurrency === "string" ? set.baseCurrency : set.currency;
  if (typeof requestedCurrency === "string" && requestedCurrency.trim()) {
    const normalizedCurrency = requestedCurrency.trim().toUpperCase();
    if (!CURRENCY_REGEX.test(normalizedCurrency)) {
      return res.status(400).json({ message: "Currency must be a 3-letter ISO code like INR or USD." });
    }
    updates["settings.currency"] = normalizedCurrency;
    updates["settings.baseCurrency"] = normalizedCurrency;
  }
  if (Number.isInteger(set.weeklyReminderDay) && set.weeklyReminderDay >= 0 && set.weeklyReminderDay <= 6) {
    updates["settings.weeklyReminderDay"] = set.weeklyReminderDay;
  }
  if (set.onboardingCompleted === true) {
    updates.onboardingCompleted = true;
    updates.onboardingCompletedAt = new Date();
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: "No valid onboarding fields were provided." });
  }

  const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true });
  if (updates["settings.baseCurrency"]) {
    await Entry.updateMany(
      { userId: req.user._id },
      { $set: { currency: updates["settings.baseCurrency"] } }
    );
  }
  return res.status(200).json({ user: publicUser(user) });
}

async function login(req, res) {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const accessToken = signAccessToken({ userId: user._id.toString() });
  const refreshToken = signRefreshToken({ userId: user._id.toString() });
  setRefreshCookie(res, refreshToken);

  return res.status(200).json({ user: publicUser(user), accessToken });
}

async function refresh(req, res) {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!refreshToken) {
    return res.status(401).json({ message: "Missing refresh token" });
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.userId);
    if (!user) {
      clearRefreshCookie(res);
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = signAccessToken({ userId: user._id.toString() });
    const newRefreshToken = signRefreshToken({ userId: user._id.toString() });
    setRefreshCookie(res, newRefreshToken);

    return res.status(200).json({ accessToken: newAccessToken });
  } catch {
    clearRefreshCookie(res);
    return res.status(401).json({ message: "Invalid refresh token" });
  }
}

async function me(req, res) {
  return res.status(200).json({ user: publicUser(req.user) });
}

async function logout(_req, res) {
  clearRefreshCookie(res);
  return res.status(200).json({ ok: true });
}

module.exports = { signup, login, refresh, me, logout, updateOnboarding };
