import express from "express";
import { mkdir, writeFile } from "node:fs/promises";
import { Buffer } from "node:buffer";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getRecentEvents, recordEvent } from "./debug-events.mjs";
import { readConfig } from "./env.mjs";
import { firstFallbackImageUrl } from "./fallback-properties.mjs";
import { handleWhatsappPayload } from "./sales-agent.mjs";
import { listShops } from "./supabase.mjs";
import { sendImage, sendText } from "./whatsapp.mjs";

let config;
try {
  config = readConfig();
} catch (error) {
  console.error(`Backend startup failed: ${error.message}`);
  process.exit(1);
}

const app = express();
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const propertyImagesDir = join(root, "property-images");
const defaultShopSlug = "estateiq-demo-realty";
const defaultShopName = "EstateIQ Demo Realty";

app.use(express.json({ limit: "8mb" }));
app.use(express.static(root));

function safeImageName(fileName = "property-image") {
  const extension = extname(fileName).toLowerCase();
  const allowed = new Set([".jpg", ".jpeg", ".png", ".webp"]);
  const safeExtension = allowed.has(extension) ? extension : ".jpg";
  const base =
    fileName
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "property-image";
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
      owner_name: "EstateIQ Broker",
      tone: "friendly, practical, trusted real estate broker",
    }),
  });
  return rows?.[0]?.id || "";
}

function normalizePropertyPayload(body, shopId) {
  return {
    shop_id: shopId,
    title: String(body.title || body.name || "").trim(),
    description: String(body.description || "").trim(),
    listing_type: ["rent", "sale"].includes(String(body.listing_type || "").toLowerCase())
      ? String(body.listing_type).toLowerCase()
      : "rent",
    property_type: String(body.property_type || "Apartment").trim(),
    locality: String(body.locality || "").trim(),
    city: String(body.city || "").trim(),
    price: Number(body.price || 0),
    bhk: Number(body.bhk || 0),
    area_sqft: Number(body.area_sqft || 0),
    furnishing: String(body.furnishing || "").trim(),
    availability: String(body.availability || body.possession || "").trim(),
    amenities: Array.isArray(body.amenities) ? body.amenities : [],
    image_url: body.image_url || "",
    status: body.status || "active",
    inquiries: Number(body.inquiries || 0),
    visits: Number(body.visits || 0),
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
    app: "EstateIQ",
    provider: "gemini",
    model: config.geminiModel,
  });
});

app.post("/api/property-images", async (request, response) => {
  const match = String(request.body?.dataUrl || "").match(/^data:image\/(?:jpeg|jpg|png|webp);base64,(.+)$/);
  if (!match) {
    response.status(400).json({ ok: false, error: "invalid_image" });
    return;
  }

  const fileName = safeImageName(request.body?.fileName);
  await mkdir(propertyImagesDir, { recursive: true });
  await writeFile(join(propertyImagesDir, fileName), Buffer.from(match[1], "base64"));
  response.json({ ok: true, image_url: `/property-images/${fileName}` });
});

app.get("/api/properties", async (request, response) => {
  try {
    const shopId = await ensureDefaultShop();
    const params = new URLSearchParams({
      select: "*",
      shop_id: `eq.${shopId}`,
      order: "created_at.desc",
    });
    const properties = await supabaseRequest(`properties?${params.toString()}`);
    response.json({ ok: true, shop_id: shopId, properties });
  } catch (error) {
    response.status(500).json({ ok: false, error: "properties_fetch_failed", detail: error.message.slice(0, 240) });
  }
});

app.post("/api/properties", async (request, response) => {
  try {
    const shopId = await ensureDefaultShop();
    const property = normalizePropertyPayload(request.body || {}, shopId);
    if (!property.title || !property.price || !property.locality) {
      response.status(400).json({ ok: false, error: "missing_property_fields" });
      return;
    }
    const rows = await supabaseRequest("properties", {
      method: "POST",
      body: JSON.stringify(property),
    });
    response.json({ ok: true, shop_id: shopId, property: rows?.[0] || property });
  } catch (error) {
    response.status(500).json({ ok: false, error: "property_insert_failed", detail: error.message.slice(0, 240) });
  }
});

app.patch("/api/properties", async (request, response) => {
  try {
    const propertyId = request.query.id;
    if (!propertyId) {
      response.status(400).json({ ok: false, error: "missing_property_id" });
      return;
    }
    const shopId = await ensureDefaultShop();
    const property = normalizePropertyPayload(request.body || {}, shopId);
    if (!property.title || !property.price || !property.locality) {
      response.status(400).json({ ok: false, error: "missing_property_fields" });
      return;
    }
    const params = new URLSearchParams({
      id: `eq.${propertyId}`,
      shop_id: `eq.${shopId}`,
    });
    const rows = await supabaseRequest(`properties?${params.toString()}`, {
      method: "PATCH",
      body: JSON.stringify(property),
    });
    response.json({ ok: true, shop_id: shopId, property: rows?.[0] || { ...property, id: propertyId } });
  } catch (error) {
    response.status(500).json({ ok: false, error: "property_update_failed", detail: error.message.slice(0, 240) });
  }
});

app.delete("/api/properties", async (request, response) => {
  try {
    const propertyId = request.query.id;
    if (!propertyId) {
      response.status(400).json({ ok: false, error: "missing_property_id" });
      return;
    }
    const shopId = await ensureDefaultShop();
    const params = new URLSearchParams({
      id: `eq.${propertyId}`,
      shop_id: `eq.${shopId}`,
    });
    await supabaseRequest(`properties?${params.toString()}`, {
      method: "DELETE",
      prefer: "return=minimal",
    });
    response.json({ ok: true, property_id: propertyId });
  } catch (error) {
    response.status(500).json({ ok: false, error: "property_delete_failed", detail: error.message.slice(0, 240) });
  }
});

app.get("/api/leads", async (request, response) => {
  try {
    const shopId = await ensureDefaultShop();
    const leadParams = new URLSearchParams({
      select: "*",
      shop_id: `eq.${shopId}`,
      order: "created_at.desc",
      limit: "50",
    });
    const messageParams = new URLSearchParams({
      select: "*",
      shop_id: `eq.${shopId}`,
      order: "created_at.desc",
      limit: "100",
    });
    const [leads, messages] = await Promise.all([
      supabaseRequest(`leads?${leadParams.toString()}`),
      supabaseRequest(`whatsapp_messages?${messageParams.toString()}`).catch(() => []),
    ]);
    response.json({ ok: true, shop_id: shopId, leads, messages });
  } catch (error) {
    response.status(500).json({ ok: false, error: "leads_fetch_failed", detail: error.message.slice(0, 240) });
  }
});

app.get("/health/deep", async (request, response) => {
  try {
    const shops = await listShops(config);
    response.json({
      ok: true,
      app: "EstateIQ",
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
      app: "EstateIQ",
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
  const message = request.body?.message || "EstateIQ WhatsApp test message.";
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

app.post("/debug/whatsapp/send-test-image", requireDebugToken, async (request, response) => {
  const to = request.body?.to;
  const imageUrl = request.body?.image_url || firstFallbackImageUrl(config);
  const caption = request.body?.caption || "EstateIQ property photo test.";
  if (!to) {
    response.status(400).json({ ok: false, error: "missing_to" });
    return;
  }
  if (!imageUrl) {
    response.status(400).json({ ok: false, error: "missing_image_url" });
    return;
  }

  try {
    const result = await sendImage(config, to, imageUrl, caption);
    response.json({ ok: true, image_url: imageUrl, result });
  } catch (error) {
    response.status(500).json({
      ok: false,
      error: "whatsapp_image_send_failed",
      image_url: imageUrl,
      detail: error.message.slice(0, 500),
    });
  }
});

app.post("/debug/webhook/simulate", requireDebugToken, async (request, response) => {
  const from = request.body?.from;
  const text = request.body?.text || "2BHK furnished flat rent in Andheri under 50k";
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
  console.log(`EstateIQ WhatsApp AI backend running at http://${config.host}:${config.port}`);
});
