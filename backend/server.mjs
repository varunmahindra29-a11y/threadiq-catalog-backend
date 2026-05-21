import express from "express";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getRecentEvents, recordEvent } from "./debug-events.mjs";
import { readConfig } from "./env.mjs";
import { handleWhatsappPayload } from "./sales-agent.mjs";
import { listShops } from "./supabase.mjs";
import { sendText } from "./whatsapp.mjs";

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

function requireDebugToken(request, response, next) {
  const token = request.get("x-debug-token");
  if (token !== config.whatsappVerifyToken) {
    response.status(401).json({ ok: false, error: "invalid_debug_token" });
    return;
  }
  next();
}

app.get("/health", (request, response) => {
  response.json({
    ok: true,
    provider: "gemini",
    model: config.geminiModel,
  });
});

app.get("/health/deep", async (request, response) => {
  try {
    const shops = await listShops(config);
    response.json({
      ok: true,
      provider: "gemini",
      model: config.geminiModel,
      supabase: {
        ok: true,
        shops: shops.length,
      },
    });
  } catch (error) {
    response.status(500).json({
      ok: false,
      provider: "gemini",
      model: config.geminiModel,
      supabase: {
        ok: false,
        error: "supabase_connection_failed",
        detail: error.message.slice(0, 240),
      },
    });
  }
});

app.get("/debug/config", requireDebugToken, (request, response) => {
  response.json({
    ok: true,
    whatsappPhoneNumberIdPresent: Boolean(config.whatsappPhoneNumberId),
    whatsappAccessTokenPresent: Boolean(config.whatsappAccessToken),
    whatsappVerifyTokenPresent: Boolean(config.whatsappVerifyToken),
    supabaseUrlPresent: Boolean(config.supabaseUrl),
    supabaseServiceRoleKeyPresent: Boolean(config.supabaseServiceRoleKey),
    geminiApiKeyPresent: Boolean(config.geminiApiKey),
    geminiModel: config.geminiModel,
  });
});

app.get("/debug/events", requireDebugToken, (request, response) => {
  response.json({
    ok: true,
    events: getRecentEvents(),
  });
});

app.post("/debug/whatsapp/send-test", requireDebugToken, async (request, response) => {
  const to = request.body?.to;
  const message = request.body?.message || "ThreadIQ WhatsApp test message.";
  if (!to) {
    response.status(400).json({ ok: false, error: "missing_to" });
    return;
  }

  try {
    const result = await sendText(config, to, message);
    response.json({ ok: true, result });
  } catch (error) {
    response.status(500).json({
      ok: false,
      error: "whatsapp_send_failed",
      detail: error.message.slice(0, 500),
    });
  }
});

app.post("/debug/webhook/simulate", requireDebugToken, async (request, response) => {
  const from = request.body?.from;
  const text = request.body?.text || "Raj Fashion ke products dikhao";
  if (!from) {
    response.status(400).json({ ok: false, error: "missing_from" });
    return;
  }

  const payload = {
    entry: [
      {
        changes: [
          {
            value: {
              messages: [
                {
                  from,
                  type: "text",
                  text: { body: text },
                },
              ],
            },
          },
        ],
      },
    ],
  };

  try {
    const results = await handleWhatsappPayload(config, payload);
    response.json({ ok: true, results });
  } catch (error) {
    response.status(500).json({
      ok: false,
      error: "webhook_simulation_failed",
      detail: error.message.slice(0, 500),
    });
  }
});

function verifyWhatsappWebhook(request, response) {
  const mode = request.query["hub.mode"];
  const token = request.query["hub.verify_token"];
  const challenge = request.query["hub.challenge"];

  if (mode === "subscribe" && token === config.whatsappVerifyToken && challenge) {
    response.status(200).send(challenge);
    return;
  }

  response.sendStatus(403);
}

async function receiveWhatsappWebhook(request, response) {
  try {
    const messages = [];
    const statuses = [];
    for (const entry of request.body?.entry || []) {
      for (const change of entry.changes || []) {
        for (const message of change.value?.messages || []) {
          messages.push({
            from: message.from,
            type: message.type,
            text: message.text?.body || "",
          });
        }
        for (const status of change.value?.statuses || []) {
          statuses.push({
            id: status.id,
            status: status.status,
            recipientId: status.recipient_id,
            errors: status.errors?.map((error) => ({
              code: error.code,
              title: error.title,
              message: error.message,
            })),
          });
        }
      }
    }
    recordEvent("webhook_received", {
      path: request.path,
      messageCount: messages.length,
      messages,
      statusCount: statuses.length,
      statuses,
    });
    const results = await handleWhatsappPayload(config, request.body);
    recordEvent("webhook_processed", {
      path: request.path,
      results,
    });
    response.status(200).json({ ok: true, results });
  } catch (error) {
    console.error(error);
    recordEvent("webhook_failed", {
      path: request.path,
      error: error.message.slice(0, 500),
    });
    response.status(500).json({ ok: false, error: "webhook_processing_failed" });
  }
}

app.get("/webhooks/whatsapp", verifyWhatsappWebhook);
app.post("/webhooks/whatsapp", receiveWhatsappWebhook);
app.get("/webhook", verifyWhatsappWebhook);
app.post("/webhook", receiveWhatsappWebhook);

app.get("*", (request, response) => {
  response.sendFile(join(root, "index.html"));
});

app.listen(config.port, config.host, () => {
  console.log(`ThreadIQ WhatsApp AI backend running at http://${config.host}:${config.port}`);
});
