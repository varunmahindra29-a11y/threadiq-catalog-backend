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
    image_url: "https://images.unsplash.com/photo-1614251056216-f748f76cd228?auto=format&fit=crop&w=1200&q=80",
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
    image_url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1200&q=80",
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
    image_url: "https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=1200&q=80",
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
    image_url: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1200&q=80",
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
    image_url: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1200&q=80",
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
    image_url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1200&q=80",
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

async function seed() {
  const endpoint = `${config.supabaseUrl.replace(/\/$/, "")}/rest/v1/products`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: createHeaders(),
    body: JSON.stringify(samples),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Sample product seed failed ${response.status}: ${detail}\nIf tables are missing, run supabase-schema.sql in Supabase SQL Editor first.`);
  }

  const inserted = await response.json();
  console.log(`Inserted ${inserted.length} sample products into Supabase products.`);
}

seed().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
