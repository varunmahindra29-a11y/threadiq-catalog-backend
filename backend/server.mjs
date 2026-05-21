import express from "express";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readConfig } from "./env.mjs";
import { handleWhatsappPayload } from "./sales-agent.mjs";

let config;
try {
  config = readConfig();
} catch (error) {
  console.error(`Backend startup failed: ${error.message}`);
  process.exit(1);
}

const app = express();
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

app.use(express.json({ limit: "2mb" }));
app.use(express.static(root));

app.get("/health", (request, response) => {
  response.json({
    ok: true,
    provider: "gemini",
    model: config.geminiModel,
  });
});

app.get("/webhooks/whatsapp", (request, response) => {
  const mode = request.query["hub.mode"];
  const token = request.query["hub.verify_token"];
  const challenge = request.query["hub.challenge"];

  if (mode === "subscribe" && token === config.whatsappVerifyToken && challenge) {
    response.status(200).send(challenge);
    return;
  }

  response.sendStatus(403);
});

app.post("/webhooks/whatsapp", async (request, response) => {
  try {
    const results = await handleWhatsappPayload(config, request.body);
    response.status(200).json({ ok: true, results });
  } catch (error) {
    console.error(error);
    response.status(500).json({ ok: false, error: "webhook_processing_failed" });
  }
});

app.get("*", (request, response) => {
  response.sendFile(join(root, "index.html"));
});

app.listen(config.port, config.host, () => {
  console.log(`ThreadIQ WhatsApp AI backend running at http://${config.host}:${config.port}`);
});
