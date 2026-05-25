import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { Buffer } from "node:buffer";
import { extname, join, normalize, resolve } from "node:path";

const root = process.cwd();
const propertyImagesDir = join(root, "property-images");
const args = process.argv.slice(2);
const host = readArg("--host") || "127.0.0.1";
const port = Number(readArg("--port") || 4173);
const maxUploadBytes = 8 * 1024 * 1024;
const defaultShopSlug = "estateiq-demo-realty";
const defaultShopName = "EstateIQ Demo Realty";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

function readArg(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : "";
}

async function loadEnvFiles() {
  for (const fileName of [".env.local", ".env"]) {
    try {
      const lines = (await readFile(resolve(root, fileName), "utf8")).split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const splitIndex = trimmed.indexOf("=");
        if (splitIndex < 1) continue;
        const key = trimmed.slice(0, splitIndex).trim();
        const value = trimmed.slice(splitIndex + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) process.env[key] = value;
      }
    } catch {
      // Optional local env file.
    }
  }
}

await loadEnvFiles();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function resolvePath(url) {
  const pathname = new URL(url, `http://${host}:${port}`).pathname;
  if (pathname === "/") return join(root, "index.html");
  const safePath = normalize(decodeURIComponent(pathname))
    .replace(/^(\.\.[/\\])+/, "")
    .replace(/^[/\\]+/, "");
  return join(root, safePath);
}

function jsonResponse(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

function hasSupabaseServerConfig() {
  return Boolean(supabaseUrl && supabaseServiceRoleKey);
}

function supabaseHeaders(prefer = "return=representation") {
  const headers = {
    apikey: supabaseServiceRoleKey,
    "Content-Type": "application/json",
    Prefer: prefer,
  };
  if (!supabaseServiceRoleKey.startsWith("sb_")) {
    headers.Authorization = `Bearer ${supabaseServiceRoleKey}`;
  }
  return headers;
}

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/${path}`, {
    ...options,
    headers: {
      ...supabaseHeaders(options.prefer),
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`supabase_${response.status}: ${detail}`);
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

function propertyIdFromRequest(request) {
  const url = new URL(request.url || "/", `http://${host}:${port}`);
  return url.searchParams.get("id") || "";
}

async function handlePropertiesApi(request, response) {
  if (!hasSupabaseServerConfig()) {
    jsonResponse(response, 503, { ok: false, error: "missing_supabase_server_config" });
    return;
  }

  const shopId = await ensureDefaultShop();
  if (!shopId) {
    jsonResponse(response, 500, { ok: false, error: "default_broker_missing" });
    return;
  }

  if (request.method === "GET") {
    const params = new URLSearchParams({
      select: "*",
      shop_id: `eq.${shopId}`,
      order: "created_at.desc",
    });
    const properties = await supabaseRequest(`properties?${params.toString()}`);
    jsonResponse(response, 200, { ok: true, shop_id: shopId, properties });
    return;
  }

  if (request.method === "POST") {
    const property = normalizePropertyPayload(await readJsonBody(request), shopId);
    if (!property.title || !property.price || !property.locality) {
      jsonResponse(response, 400, { ok: false, error: "missing_property_fields" });
      return;
    }
    const rows = await supabaseRequest("properties", {
      method: "POST",
      body: JSON.stringify(property),
    });
    jsonResponse(response, 200, { ok: true, shop_id: shopId, property: rows?.[0] || property });
    return;
  }

  if (request.method === "PATCH") {
    const propertyId = propertyIdFromRequest(request);
    if (!propertyId) {
      jsonResponse(response, 400, { ok: false, error: "missing_property_id" });
      return;
    }
    const property = normalizePropertyPayload(await readJsonBody(request), shopId);
    if (!property.title || !property.price || !property.locality) {
      jsonResponse(response, 400, { ok: false, error: "missing_property_fields" });
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
    jsonResponse(response, 200, { ok: true, shop_id: shopId, property: rows?.[0] || { ...property, id: propertyId } });
    return;
  }

  if (request.method === "DELETE") {
    const propertyId = propertyIdFromRequest(request);
    if (!propertyId) {
      jsonResponse(response, 400, { ok: false, error: "missing_property_id" });
      return;
    }
    const params = new URLSearchParams({
      id: `eq.${propertyId}`,
      shop_id: `eq.${shopId}`,
    });
    await supabaseRequest(`properties?${params.toString()}`, {
      method: "DELETE",
      prefer: "return=minimal",
    });
    jsonResponse(response, 200, { ok: true, property_id: propertyId });
    return;
  }

  jsonResponse(response, 405, { ok: false, error: "method_not_allowed" });
}

async function handleLeadsApi(request, response) {
  if (request.method !== "GET") {
    jsonResponse(response, 405, { ok: false, error: "method_not_allowed" });
    return;
  }
  if (!hasSupabaseServerConfig()) {
    jsonResponse(response, 503, { ok: false, error: "missing_supabase_server_config" });
    return;
  }

  const shopId = await ensureDefaultShop();
  if (!shopId) {
    jsonResponse(response, 500, { ok: false, error: "default_broker_missing" });
    return;
  }

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
  jsonResponse(response, 200, { ok: true, shop_id: shopId, leads, messages });
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxUploadBytes) {
        reject(new Error("upload_too_large"));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch {
        reject(new Error("invalid_json"));
      }
    });
    request.on("error", reject);
  });
}

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

async function handleImageUpload(request, response) {
  try {
    const body = await readJsonBody(request);
    const match = String(body.dataUrl || "").match(/^data:image\/(?:jpeg|jpg|png|webp);base64,(.+)$/);
    if (!match) {
      jsonResponse(response, 400, { ok: false, error: "invalid_image" });
      return;
    }

    const fileName = safeImageName(body.fileName);
    await mkdir(propertyImagesDir, { recursive: true });
    await writeFile(join(propertyImagesDir, fileName), Buffer.from(match[1], "base64"));
    jsonResponse(response, 200, { ok: true, image_url: `/property-images/${fileName}` });
  } catch (error) {
    const status = error.message === "upload_too_large" ? 413 : 400;
    jsonResponse(response, status, { ok: false, error: error.message });
  }
}

const server = createServer(async (request, response) => {
  const pathname = new URL(request.url || "/", `http://${host}:${port}`).pathname;
  try {
    if (pathname === "/api/property-images" && request.method === "POST") {
      await handleImageUpload(request, response);
      return;
    }
    if (pathname === "/api/properties") {
      await handlePropertiesApi(request, response);
      return;
    }
    if (pathname === "/api/leads") {
      await handleLeadsApi(request, response);
      return;
    }

    const filePath = resolvePath(request.url || "/");
    const body = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(body);
  } catch (error) {
    if (pathname.startsWith("/api/")) {
      jsonResponse(response, 500, { ok: false, error: "api_request_failed", detail: error.message.slice(0, 240) });
      return;
    }
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

server.listen(port, host, () => {
  console.log(`EstateIQ running at http://${host}:${port}`);
});
