import { loadEnvFiles } from "../backend/env.mjs";

loadEnvFiles();

const config = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

const missing = Object.entries({
  SUPABASE_URL: config.supabaseUrl,
  SUPABASE_SERVICE_ROLE_KEY: config.supabaseServiceRoleKey,
})
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missing.length) {
  throw new Error(`Missing Supabase environment variables: ${missing.join(", ")}`);
}

const samples = [
  {
    name: "Black Embroidered Party Kurta",
    description: "Black festive kurta with subtle embroidery, perfect for birthday parties, family functions, and evening events.",
    category: "Ethnic",
    price: 1499,
    stock: 12,
    sizes: ["M", "L", "XL"],
    colors: ["Black"],
    image_url: "/product-images/black-party-kurta.jpg",
    status: "active",
    inquiries: 32,
    orders: 8,
  },
  {
    name: "White Minimal Linen Shirt",
    description: "Clean white linen-look shirt for smart casual looks, dates, office wear, and summer styling.",
    category: "Shirts",
    price: 1199,
    stock: 18,
    sizes: ["S", "M", "L", "XL"],
    colors: ["White"],
    image_url: "/product-images/white-linen-shirt.jpg",
    status: "active",
    inquiries: 27,
    orders: 6,
  },
  {
    name: "Blue Washed Denim Jacket",
    description: "Classic blue denim jacket that works over tees, shirts, and kurtas for a bold streetwear layer.",
    category: "Jackets",
    price: 2499,
    stock: 9,
    sizes: ["M", "L", "XL"],
    colors: ["Blue"],
    image_url: "/product-images/blue-denim-jacket.jpg",
    status: "active",
    inquiries: 24,
    orders: 5,
  },
  {
    name: "Rust Festive Kurta Set",
    description: "Warm rust kurta set for festive days, mehendi functions, and traditional party looks.",
    category: "Ethnic",
    price: 1799,
    stock: 10,
    sizes: ["S", "M", "L"],
    colors: ["Rust", "Orange"],
    image_url: "/product-images/rust-kurta-set.jpg",
    status: "active",
    inquiries: 21,
    orders: 4,
  },
  {
    name: "Sage Relaxed Trousers",
    description: "Relaxed sage trousers with a clean fall, easy to pair with white, black, or printed shirts.",
    category: "Trousers",
    price: 1399,
    stock: 14,
    sizes: ["30", "32", "34", "36"],
    colors: ["Sage", "Green"],
    image_url: "/product-images/sage-trousers.jpg",
    status: "active",
    inquiries: 19,
    orders: 3,
  },
  {
    name: "White Street Sneakers",
    description: "Minimal white sneakers for everyday outfits, party casual looks, and college styling.",
    category: "Footwear",
    price: 1999,
    stock: 20,
    sizes: ["7", "8", "9", "10"],
    colors: ["White"],
    image_url: "/product-images/white-sneakers.jpg",
    status: "active",
    inquiries: 30,
    orders: 9,
  },
];

function createHeaders() {
  const headers = {
    apikey: config.supabaseServiceRoleKey,
    "Content-Type": "application/json",
    Prefer: "return=representation",
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
      ...createHeaders(),
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

async function ensureShop() {
  const query = new URLSearchParams({
    select: "id",
    slug: "eq.raj-fashion",
    limit: "1",
  });
  const existing = await supabaseRequest(`shops?${query.toString()}`);
  if (existing?.[0]?.id) return existing[0].id;

  const rows = await supabaseRequest("shops", {
    method: "POST",
    body: JSON.stringify({
      name: "Raj Fashion",
      slug: "raj-fashion",
      owner_name: "Raj Fashion Owner",
      owner_whatsapp: null,
      tone: "friendly, confident, local fashion salesman",
    }),
  });
  return rows?.[0]?.id;
}

async function upsertProduct(shopId, product) {
  const query = new URLSearchParams({
    select: "id",
    shop_id: `eq.${shopId}`,
    name: `eq.${product.name}`,
    limit: "1",
  });
  const existing = await supabaseRequest(`products?${query.toString()}`);
  const body = JSON.stringify({ ...product, shop_id: shopId });

  if (existing?.[0]?.id) {
    const params = new URLSearchParams({ id: `eq.${existing[0].id}` });
    await supabaseRequest(`products?${params.toString()}`, {
      method: "PATCH",
      body,
    });
    return "updated";
  }

  await supabaseRequest("products", {
    method: "POST",
    body,
  });
  return "inserted";
}

async function seed() {
  const shopId = await ensureShop();
  if (!shopId) {
    throw new Error("Could not create or find Raj Fashion shop.");
  }

  const counts = { inserted: 0, updated: 0 };
  for (const product of samples) {
    const status = await upsertProduct(shopId, product);
    counts[status] += 1;
  }
  console.log(`Seeded ${samples.length} local-image products for Raj Fashion (${counts.inserted} inserted, ${counts.updated} updated).`);
}

seed().catch((error) => {
  console.error(`${error.message}\nIf tables are missing, run supabase-schema.sql in Supabase SQL Editor first.`);
  process.exit(1);
});
