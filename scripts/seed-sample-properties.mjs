import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();

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
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding properties.");
}

const samples = [
  {
    title: "Furnished 2BHK near Andheri West Metro",
    description: "Move-in ready apartment in a gated society with parking, lift, security, and quick metro access.",
    listing_type: "rent",
    property_type: "Apartment",
    locality: "Andheri West",
    city: "Mumbai",
    price: 48000,
    bhk: 2,
    area_sqft: 780,
    furnishing: "Furnished",
    availability: "Immediate",
    amenities: ["Parking", "Lift", "Security", "Metro nearby"],
    image_url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    status: "active",
    inquiries: 34,
    visits: 9,
  },
  {
    title: "Lake-view 3BHK in Powai",
    description: "Premium resale apartment with balcony, clubhouse access, and two covered parking slots.",
    listing_type: "sale",
    property_type: "Apartment",
    locality: "Powai",
    city: "Mumbai",
    price: 28500000,
    bhk: 3,
    area_sqft: 1280,
    furnishing: "Semi-furnished",
    availability: "Ready to move",
    amenities: ["Clubhouse", "Balcony", "Parking", "Lake view"],
    image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    status: "active",
    inquiries: 28,
    visits: 6,
  },
  {
    title: "Ready 2BHK in Sector 76 Noida",
    description: "Compact family apartment in a maintained society with park, power backup, and covered parking.",
    listing_type: "sale",
    property_type: "Apartment",
    locality: "Sector 76",
    city: "Noida",
    price: 8200000,
    bhk: 2,
    area_sqft: 1045,
    furnishing: "Unfurnished",
    availability: "Ready to move",
    amenities: ["Park", "Power backup", "Parking", "Security"],
    image_url: "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=1200&q=80",
    status: "active",
    inquiries: 22,
    visits: 5,
  },
];

function headers(prefer = "return=representation") {
  const result = {
    apikey: serviceRoleKey,
    "Content-Type": "application/json",
    Prefer: prefer,
  };
  if (!serviceRoleKey.startsWith("sb_")) {
    result.Authorization = `Bearer ${serviceRoleKey}`;
  }
  return result;
}

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/${path}`, {
    ...options,
    headers: {
      ...headers(options.prefer),
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

async function ensureBroker() {
  const query = new URLSearchParams({
    select: "id",
    slug: "eq.estateiq-demo-realty",
    limit: "1",
  });
  const existing = await supabaseRequest(`shops?${query.toString()}`);
  if (existing?.[0]?.id) return existing[0].id;

  const rows = await supabaseRequest("shops", {
    method: "POST",
    body: JSON.stringify({
      name: "EstateIQ Demo Realty",
      slug: "estateiq-demo-realty",
      owner_name: "EstateIQ Broker",
      tone: "friendly, practical, trusted real estate broker",
    }),
  });
  return rows?.[0]?.id || "";
}

async function upsertProperty(shopId, property) {
  const query = new URLSearchParams({
    select: "id",
    shop_id: `eq.${shopId}`,
    title: `eq.${property.title}`,
    limit: "1",
  });
  const existing = await supabaseRequest(`properties?${query.toString()}`);
  const body = JSON.stringify({ ...property, shop_id: shopId });
  if (existing?.[0]?.id) {
    const params = new URLSearchParams({ id: `eq.${existing[0].id}` });
    await supabaseRequest(`properties?${params.toString()}`, {
      method: "PATCH",
      body,
    });
    return "updated";
  }
  await supabaseRequest("properties", {
    method: "POST",
    body,
  });
  return "inserted";
}

const shopId = await ensureBroker();
if (!shopId) throw new Error("Could not create or find EstateIQ Demo Realty broker.");

const counts = { inserted: 0, updated: 0 };
for (const property of samples) {
  const status = await upsertProperty(shopId, property);
  counts[status] += 1;
}

console.log(`Seeded ${samples.length} properties for EstateIQ Demo Realty (${counts.inserted} inserted, ${counts.updated} updated).`);
