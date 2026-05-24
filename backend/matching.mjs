const INTEREST_PATTERNS = [
  /\b(available|book|buy|order|price|rate|cost)\b/i,
  /(ye|yah|isko|is product|chahiye|chaiye|pasand|bhej do|pack kar|confirm)/i,
  /(kitne ka|mil jayega|mil jaayega| lena hai| lena h)/i,
];

const CATEGORY_WORDS = {
  shirt: ["shirt", "shirts"],
  tshirt: ["tshirt", "t-shirt", "tee", "tees"],
  jeans: ["jeans", "denim"],
  jacket: ["jacket", "jackets"],
  trouser: ["trouser", "trousers", "pant", "pants"],
  ethnic: ["kurta", "ethnic", "sherwani"],
  footwear: ["shoe", "shoes", "sneaker", "sneakers", "footwear"],
};

const GENERIC_TERMS = new Set([
  "raj",
  "fashion",
  "product",
  "products",
  "catalog",
  "catalogue",
  "dikhao",
  "dikhana",
  "show",
  "bhejo",
  "photo",
  "photos",
  "image",
  "images",
  "hai",
  "hain",
  "kya",
  "ke",
  "ka",
  "ki",
  "se",
  "me",
  "mein",
  "under",
  "below",
  "budget",
  "size",
]);

export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function detectInterest(message) {
  return INTEREST_PATTERNS.some((pattern) => pattern.test(message));
}

export function extractBudget(message) {
  const match = String(message).match(/(?:under|below|less than|budget|₹|rs\.?|inr)\s*(\d{2,7})/i);
  return match ? Number(match[1]) : 0;
}

export function extractTerms(message) {
  return String(message)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 1);
}

function searchableProductText(product) {
  return [
    product.name,
    product.description,
    product.category,
    ...(Array.isArray(product.colors) ? product.colors : []),
    ...(Array.isArray(product.sizes) ? product.sizes : []),
  ]
    .join(" ")
    .toLowerCase();
}

function productMatchesCategory(product, categoryHints) {
  if (!categoryHints.length) return true;
  const text = searchableProductText(product);
  return categoryHints.some((hint) => [hint, ...(CATEGORY_WORDS[hint] || [])].some((alias) => text.includes(alias)));
}

export function findShopByMessage(shops, message) {
  if (shops.length === 1) return shops[0];

  const normalizedMessage = slugify(message);
  return shops.find((shop) => {
    const nameSlug = slugify(shop.name);
    const explicitSlug = slugify(shop.slug || shop.name);
    return normalizedMessage.includes(nameSlug) || normalizedMessage.includes(explicitSlug);
  });
}

export function rankProducts(products, message, limit = 3) {
  const terms = extractTerms(message);
  const specificTerms = terms.filter((term) => !GENERIC_TERMS.has(term));
  const budget = extractBudget(message);
  const categoryHints = Object.entries(CATEGORY_WORDS)
    .filter(([, aliases]) => aliases.some((alias) => terms.includes(alias)))
    .map(([category]) => category);
  const hasSpecificSignal = specificTerms.length > 0 || categoryHints.length > 0 || budget > 0;

  return products
    .filter((product) => productMatchesCategory(product, categoryHints))
    .map((product) => {
      const text = searchableProductText(product);
      const nameSlug = slugify(product.name);
      const messageSlug = slugify(message);
      const exactNameScore = messageSlug.includes(nameSlug) || nameSlug.includes(messageSlug) ? 60 : 0;
      const keywordScore = specificTerms.reduce((score, term) => score + (text.includes(term) ? 14 : 0), 0);
      const categoryScore = categoryHints.some((hint) => text.includes(hint)) ? 18 : 0;
      const budgetScore = budget && Number(product.price) <= budget ? 18 : 0;
      const demandScore = hasSpecificSignal ? Math.min(Number(product.inquiries || 0), 8) : Math.min(Number(product.inquiries || 0), 25);
      const stockScore = Number(product.stock || 0) > 0 ? 10 : -100;
      return {
        product,
        matchScore: exactNameScore + keywordScore + categoryScore + budgetScore,
        score: exactNameScore + keywordScore + categoryScore + budgetScore + demandScore + stockScore,
      };
    })
    .filter(({ matchScore }) => !hasSpecificSignal || matchScore > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ product }) => product);
}
