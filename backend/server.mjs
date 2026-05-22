import express from "express";
import { mkdir, writeFile } from "node:fs/promises";
import { Buffer } from "node:buffer";
import { dirname, extname, join } from "node:path";
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
const productImagesDir = join(root, "product-images");
const defaultShopSlug = "raj-fashion";
const defaultShopName = "Raj Fashion";

app.use(express.json({ limit: "8mb" }));
app.use(express.static(root));

function safeImageName(fileName = "product-image") {
  const extension = extname(fileName).toLowerCase();
  const allowed = new Set([".jpg", ".jpeg", ".png", ".webp"]);
  const safeExtension = allowed.has(extension) ? extension : ".jpg";
  const base = fileName
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "product-image";
  return `${base}-${Date.now()}${safeExtension}`;
}

function supabaseHeaders(prefer = "return=representation") {
  const headers = {
    apikey: config.supabaseServiceRoleKey,
    "Content-Type": "application/json",
    Prefer: prefer,
  };
  if (!config.supabaseServiceRoleKey.startsWith("sb_")) {
    headers.Authorization = `Bearer ${config.supabaseServiceRoleKey}`;
  }
  return headers;
}

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${config.supabaseUrl.replace(/\/$/, "")}/rest/v1/${path}`, {
    ...options,
    headers: {
      ...supabaseHeaders(options.prefer),
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase request failed ${response.status}: ${detail}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

async function ensureDefaultShop() {
  const query = new URLSearchParams({
    select: "id",
    slug: `eq.${defaultShopSlug}`,
    limit: "1",
  });
  const existing = await supabaseRequest(`shops?${query.toString()}`);
  if (existing?.[0]?.id) return existing[0].id;
  const rows = await supabaseRequest("shops", {
    method: "POST",
    body: JSON.stringify({
      name: defaultShopName,
      slug: defaultShopSlug,
      owner_name: `${defaultShopName} Owner`,
      tone: "friendly, confident, local fashion salesman",
    }),
  });
  return rows?.[0]?.id || "";
}

function normalizeProductPayload(body, shopId) {
  return {
    shop_id: shopId,
    name: String(body.name || "").trim(),
    category: String(body.category || "").trim() || "General",
    price: Number(body.price || 0),
    stock: Number(body.stock || 0),
    sizes: Array.isArray(body.sizes) ? body.sizes : [],
    colors: Array.isArray(body.colors) ? body.colors : [],
    image_url: body.image_url || "",
    status: body.status || "active",
    inquiries: Number(body.inquiries || 0),
    orders: Number(body.orders || 0),
  };
}

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

app.post("/api/product-images", async (request, response) => {
  const match = String(request.body?.dataUrl || "").match(/^data:image\/(?:jpeg|jpg|png|webp);base64,(.+)$/);
  if (!match) {
    response.status(400).json({ ok: false, error: "invalid_image" });
    return;
  }

  const fileName = safeImageName(request.body?.fileName);
  await mkdir(productImagesDir, { recursive: true });
  await writeFile(join(productImagesDir, fileName), Buffer.from(match[1], "base64"));
  response.json({ ok: true, image_url: `/product-images/${fileName}` });
});

app.get("/api/products", async (request, response) => {
  try {
    const shopId = await ensureDefaultShop();
    const params = new URLSearchParams({
      select: "*",
      shop_id: `eq.${shopId}`,
      order: "created_at.desc",
    });
    const products = await supabaseRequest(`products?${params.toString()}`);
    response.json({ ok: true, shop_id: shopId, products });
  } catch (error) {
    response.status(500).json({ ok: false, error: "products_fetch_failed", detail: error.message.slice(0, 240) });
  }
});

app.post("/api/products", async (request, response) => {
  try {
    const shopId = await ensureDefaultShop();
    const product = normalizeProductPayload(request.body || {}, shopId);
    if (!product.name || !product.price) {
      response.status(400).json({ ok: false, error: "missing_product_fields" });
      return;
    }
    const rows = await supabaseRequest("products", {
      method: "POST",
      body: JSON.stringify(product),
    });
    response.json({ ok: true, shop_id: shopId, product: rows?.[0] || product });
  } catch (error) {
    response.status(500).json({ ok: false, error: "product_insert_failed", detail: error.message.slice(0, 240) });
  }
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
    publicBaseUrlPresent: Boolean(config.publicBaseUrl),
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
