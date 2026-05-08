const User = require("../models/User");
const { verifyAccessToken } = require("../utils/tokens");

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Missing access token" });
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.userId).lean();
    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

module.exports = { authMiddleware };
