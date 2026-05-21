import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ENV_FILES = [".env.local", ".env"];

export function loadEnvFiles(root = process.cwd()) {
  for (const file of ENV_FILES) {
    const path = resolve(root, file);
    if (!existsSync(path)) continue;
    const lines = readFileSync(path, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const splitIndex = trimmed.indexOf("=");
      if (splitIndex < 1) continue;
      const key = trimmed.slice(0, splitIndex).trim();
      const rawValue = trimmed.slice(splitIndex + 1).trim();
      if (process.env[key]) continue;
      process.env[key] = rawValue.replace(/^["']|["']$/g, "");
    }
  }
}

export function readConfig() {
  loadEnvFiles();
  const config = {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
    geminiApiKey: process.env.GEMINI_API_KEY,
    geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    host: process.env.HOST || "0.0.0.0",
    port: Number(process.env.PORT || 8787),
  };

  const missing = [
    ["SUPABASE_URL", config.supabaseUrl],
    ["SUPABASE_SERVICE_ROLE_KEY", config.supabaseServiceRoleKey],
    ["WHATSAPP_PHONE_NUMBER_ID", config.whatsappPhoneNumberId],
    ["WHATSAPP_ACCESS_TOKEN", config.whatsappAccessToken],
    ["WHATSAPP_VERIFY_TOKEN", config.whatsappVerifyToken],
    ["GEMINI_API_KEY", config.geminiApiKey],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(`Missing backend environment variables: ${missing.join(", ")}`);
  }

  return config;
}
