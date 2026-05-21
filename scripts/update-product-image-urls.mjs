import { loadEnvFiles } from "../backend/env.mjs";

loadEnvFiles();

const baseUrl = process.env.PUBLIC_BASE_URL || "https://threadiq-catalog-backend-production.up.railway.app";
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const updates = [
  ["Black Embroidered Party Kurta", "black-party-kurta.jpg"],
  ["White Minimal Linen Shirt", "white-linen-shirt.jpg"],
  ["Blue Washed Denim Jacket", "blue-denim-jacket.jpg"],
  ["Rust Festive Kurta Set", "rust-kurta-set.jpg"],
  ["Sage Relaxed Trousers", "sage-trousers.jpg"],
  ["White Street Sneakers", "white-sneakers.jpg"],
];

function headers() {
  const value = {
    apikey: supabaseKey,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
  if (!supabaseKey.startsWith("sb_")) {
    value.Authorization = `Bearer ${supabaseKey}`;
  }
  return value;
}

async function updateOne([name, file]) {
  const params = new URLSearchParams({ name: `eq.${name}` });
  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/products?${params}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({
      image_url: `${baseUrl.replace(/\/$/, "")}/product-images/${file}`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update ${name}: ${response.status} ${await response.text()}`);
  }

  const rows = await response.json();
  console.log(`Updated ${name}: ${rows.length} row(s)`);
}

for (const update of updates) {
  await updateOne(update);
}
