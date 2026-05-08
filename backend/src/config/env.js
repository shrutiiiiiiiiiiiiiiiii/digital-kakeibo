const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

function loadEnvFiles() {
  const cwdEnv = path.resolve(process.cwd(), ".env");
  const backendEnv = path.resolve(__dirname, "../../.env");
  const rootEnv = path.resolve(__dirname, "../../../.env");

  // Prefer explicit backend-local env, then cwd (often monorepo root), then repo-root fallback.
  const candidates = [backendEnv, cwdEnv, rootEnv];
  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) {
      dotenv.config({ path: filePath });
      return;
    }
  }

  // Default dotenv resolution (usually `process.cwd()/.env`)
  dotenv.config();
}

loadEnvFiles();

function getEnv(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  mongoUri: getEnv("MONGODB_URI"),
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:3000",
  jwtAccessSecret: getEnv("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: getEnv("JWT_REFRESH_SECRET"),
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL ?? "15m",
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL ?? "7d",
  cookieSecure: process.env.COOKIE_SECURE === "true",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
};

module.exports = env;
