const INTEREST_PATTERNS = [
  /\b(visit|site visit|call|callback|book|shortlist|final|interested|confirm|schedule)\b/i,
  /(ye|yah|isko|is flat|property|ghar|unit).*(chahiye|chaiye|pasand|dekhna|dikha do|confirm)/i,
  /(broker|owner).*(call|connect|baat)/i,
  /(visit karna|dekhna hai|call kara|call karwa|number bhej|time bata)/i,
];

const PROPERTY_TYPE_WORDS = {
  apartment: ["apartment", "flat", "society", "condo"],
  villa: ["villa", "bungalow", "independent house", "house"],
  studio: ["studio", "1rk", "rk"],
  plot: ["plot", "land"],
  office: ["office", "commercial", "workspace"],
};

const GENERIC_TERMS = new Set([
  "estateiq",
  "demo",
  "realty",
  "property",
  "properties",
  "listing",
  "listings",
  "flat",
  "ghar",
  "house",
  "apartment",
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
  "near",
  "under",
  "below",
  "budget",
  "rent",
  "sale",
  "buy",
  "bhk",
  "for",
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

function parseMoneyValue(rawNumber, suffix = "") {
  const value = Number(String(rawNumber || "").replace(/,/g, ""));
  if (!Number.isFinite(value)) return 0;
  const normalizedSuffix = suffix.toLowerCase();
  if (normalizedSuffix === "k") return value * 1000;
  if (["l", "lac", "lakh", "lakhs"].includes(normalizedSuffix)) return value * 100000;
  if (["cr", "crore", "crores"].includes(normalizedSuffix)) return value * 10000000;
  return value;
}

export function extractBudget(message) {
  const text = String(message || "").toLowerCase();
  const moneyPattern = /(?:under|below|less than|budget|upto|up to|rs\.?|inr|rent|price|sale)\s*(\d+(?:\.\d+)?)\s*(k|l|lac|lakh|lakhs|cr|crore|crores)?\b/i;
  const contextual = text.match(moneyPattern);
  if (contextual) return parseMoneyValue(contextual[1], contextual[2]);

  const suffixed = text.match(/\b(\d+(?:\.\d+)?)\s*(k|l|lac|lakh|lakhs|cr|crore|crores)\b/i);
  return suffixed ? parseMoneyValue(suffixed[1], suffixed[2]) : 0;
}

export function extractListingType(message) {
  const text = String(message || "").toLowerCase();
  if (/\b(rent|rental|lease|kiraya|kiraye|tenant|pg)\b/.test(text)) return "rent";
  if (/\b(sale|buy|purchase|kharid|khareed|resale|sell)\b/.test(text)) return "sale";
  return "";
}

export function extractBhk(message) {
  const text = String(message || "").toLowerCase();
  const match = text.match(/\b([1-9])\s*(?:bhk|bed|bedroom|br)\b/);
  return match ? Number(match[1]) : 0;
}

export function extractTerms(message) {
  return String(message || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s.-]/gu, " ")
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 1 && !/^\d+(?:\.\d+)?$/.test(term));
}

function searchablePropertyText(property) {
  return [
    property.title,
    property.name,
    property.description,
    property.property_type,
    property.locality,
    property.city,
    property.furnishing,
    property.availability,
    property.possession,
    property.listing_type,
    ...(Array.isArray(property.amenities) ? property.amenities : []),
  ]
    .join(" ")
    .toLowerCase();
}

function propertyMatchesType(property, typeHints) {
  if (!typeHints.length) return true;
  const text = searchablePropertyText(property);
  return typeHints.some((hint) => [hint, ...(PROPERTY_TYPE_WORDS[hint] || [])].some((alias) => text.includes(alias)));
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

export function extractRequirements(message) {
  const terms = extractTerms(message);
  return {
    terms,
    specificTerms: terms.filter((term) => !GENERIC_TERMS.has(term)),
    budget: extractBudget(message),
    listingType: extractListingType(message),
    bhk: extractBhk(message),
    typeHints: Object.entries(PROPERTY_TYPE_WORDS)
      .filter(([, aliases]) => aliases.some((alias) => String(message).toLowerCase().includes(alias)))
      .map(([type]) => type),
  };
}

export function rankProperties(properties, message, limit = 3) {
  const requirements = extractRequirements(message);
  const hasSpecificSignal =
    requirements.specificTerms.length > 0 ||
    requirements.budget > 0 ||
    requirements.listingType ||
    requirements.bhk > 0 ||
    requirements.typeHints.length > 0;

  return properties
    .filter((property) => !requirements.listingType || String(property.listing_type || "").toLowerCase() === requirements.listingType)
    .filter((property) => String(property.status || "active").toLowerCase() === "active")
    .filter((property) => propertyMatchesType(property, requirements.typeHints))
    .map((property) => {
      const text = searchablePropertyText(property);
      const titleSlug = slugify(property.title || property.name);
      const messageSlug = slugify(message);
      const exactTitleScore = titleSlug && (messageSlug.includes(titleSlug) || titleSlug.includes(messageSlug)) ? 50 : 0;
      const keywordScore = requirements.specificTerms.reduce((score, term) => score + (text.includes(term) ? 12 : 0), 0);
      const localityScore = property.locality && messageSlug.includes(slugify(property.locality)) ? 28 : 0;
      const cityScore = property.city && messageSlug.includes(slugify(property.city)) ? 10 : 0;
      const typeScore = requirements.typeHints.length && requirements.typeHints.some((hint) => text.includes(hint)) ? 16 : 0;
      const listingTypeScore = requirements.listingType ? 18 : 0;
      const bhkScore = requirements.bhk && Number(property.bhk || 0) === requirements.bhk ? 24 : 0;
      const budgetScore = requirements.budget && Number(property.price || 0) <= requirements.budget ? 24 : 0;
      const furnishingScore =
        /furnished|semi furnished|semi-furnished|unfurnished/i.test(message) &&
        text.includes(String(message).toLowerCase().match(/semi[-\s]?furnished|furnished|unfurnished/)?.[0] || "")
          ? 10
          : 0;
      const demandScore = Math.min(Number(property.inquiries || 0), hasSpecificSignal ? 8 : 22);
      const visitScore = Math.min(Number(property.visits || 0), 8);
      const matchScore =
        exactTitleScore +
        keywordScore +
        localityScore +
        cityScore +
        typeScore +
        listingTypeScore +
        bhkScore +
        budgetScore +
        furnishingScore;
      return {
        property,
        matchScore,
        score: matchScore + demandScore + visitScore,
      };
    })
    .filter(({ matchScore }) => !hasSpecificSignal || matchScore > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ property }) => property);
}
