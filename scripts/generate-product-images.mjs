import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = join(process.cwd(), "product-images");
mkdirSync(outDir, { recursive: true });

const products = [
  {
    file: "black-party-kurta.svg",
    title: "Black Party Kurta",
    subtitle: "Embroidery | M L XL | Rs 1499",
    bg: "#111111",
    accent: "#c8a24a",
  },
  {
    file: "white-linen-shirt.svg",
    title: "White Linen Shirt",
    subtitle: "Smart Casual | S M L XL | Rs 1199",
    bg: "#f7f7f2",
    accent: "#0e7c66",
    dark: true,
  },
  {
    file: "blue-denim-jacket.svg",
    title: "Blue Denim Jacket",
    subtitle: "Streetwear Layer | M L XL | Rs 2499",
    bg: "#224f83",
    accent: "#f5f1e8",
  },
  {
    file: "rust-kurta-set.svg",
    title: "Rust Kurta Set",
    subtitle: "Festive Fit | S M L | Rs 1799",
    bg: "#9b3f27",
    accent: "#ffd19c",
  },
  {
    file: "sage-trousers.svg",
    title: "Sage Trousers",
    subtitle: "Relaxed Fit | 30 32 34 36 | Rs 1399",
    bg: "#7c8d73",
    accent: "#f9f3dc",
  },
  {
    file: "white-sneakers.svg",
    title: "White Street Sneakers",
    subtitle: "Daily Wear | 7 8 9 10 | Rs 1999",
    bg: "#e9e9e9",
    accent: "#222222",
    dark: true,
  },
];

function svg(product) {
  const text = product.dark ? "#141414" : "#ffffff";
  const secondary = product.dark ? "#333333" : "#f4f4f4";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
  <rect width="1200" height="900" fill="${product.bg}"/>
  <circle cx="1010" cy="160" r="150" fill="${product.accent}" opacity="0.28"/>
  <circle cx="170" cy="740" r="220" fill="${product.accent}" opacity="0.18"/>
  <rect x="150" y="140" width="900" height="620" rx="36" fill="none" stroke="${product.accent}" stroke-width="10"/>
  <text x="600" y="390" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="78" font-weight="800" fill="${text}">${product.title}</text>
  <text x="600" y="480" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="600" fill="${secondary}">${product.subtitle}</text>
  <text x="600" y="635" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="800" fill="${product.accent}">Raj Fashion</text>
</svg>`;
}

for (const product of products) {
  writeFileSync(join(outDir, product.file), svg(product));
}

console.log(`Generated ${products.length} product image assets in ${outDir}`);
