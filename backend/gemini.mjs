function compactProperty(property) {
  return {
    id: property.id,
    title: property.title || property.name,
    listing_type: property.listing_type,
    property_type: property.property_type,
    locality: property.locality,
    city: property.city,
    price: Number(property.price || 0),
    bhk: Number(property.bhk || 0),
    area_sqft: Number(property.area_sqft || 0),
    furnishing: property.furnishing,
    availability: property.availability || property.possession,
    amenities: property.amenities || [],
    description: property.description,
  };
}

export const TECHNICAL_ISSUE_REPLY = "Hamari team abhi technical issue pe kaam kar rahi hai. Soon we will be live again.";

function modelFallbacks(config) {
  return [...new Set([config.geminiModel, "gemini-2.5-flash-lite", "gemini-2.5-flash"].filter(Boolean))];
}

async function generateContent(config, body) {
  const errors = [];
  for (const model of modelFallbacks(config)) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(config.geminiApiKey)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const result = await response.json();
      return {
        model,
        text: result?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim() || "",
      };
    }

    const detail = await response.text();
    errors.push(`${model}: ${response.status} ${detail.slice(0, 180)}`);
  }

  throw new Error(`Gemini request failed for all models: ${errors.join(" | ")}`);
}

export async function generateShortBrokerReply(config, { shop, customerMessage, purpose, properties = [] }) {
  const prompt = [
    "You are EstateIQ, a friendly Hinglish AI real estate broker assistant on WhatsApp.",
    `Broker/agency name: ${shop?.name || "EstateIQ"}`,
    `Purpose: ${purpose}`,
    "Write one short natural WhatsApp message.",
    "Do not sound like a template. Do not mention that you are using a prompt.",
    "Use only provided property facts. Never invent price, availability, amenities, brokerage, discounts, or promises.",
    "If a lead is interested, ask for preferred callback or site visit time.",
    `Customer message: ${customerMessage}`,
    `Properties: ${JSON.stringify(properties.map(compactProperty))}`,
  ].join("\n");

  const { text } = await generateContent(config, {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.65,
    },
  });

  return text || TECHNICAL_ISSUE_REPLY;
}

export async function generatePropertyCaptions(config, { shop, properties, customerMessage }) {
  const prompt = [
    "You are a friendly Hinglish real estate broker on WhatsApp.",
    `Broker/agency name: ${shop.name}`,
    `Tone: ${shop.tone || "friendly, practical, trusted"}`,
    "Use only the property facts provided. Never invent price, area, availability, brokerage, discounts, amenities, or ownership details.",
    "Return strict JSON only: {\"captions\":[{\"property_id\":\"...\",\"caption\":\"...\"}]}",
    "Each caption must be short, useful, and include title, locality, rent/sale price, BHK/area, furnishing/availability if available, plus a site visit/callback CTA.",
    `Customer requirement: ${customerMessage}`,
    `Properties: ${JSON.stringify(properties.map(compactProperty))}`,
  ].join("\n");

  const { text } = await generateContent(config, {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.45,
      responseMimeType: "application/json",
    },
  });
  const parsed = JSON.parse(text);
  const captions = Array.isArray(parsed.captions) ? parsed.captions : [];
  const missingCaption = properties.some((property) => {
    const match = captions.find((caption) => caption.property_id === property.id);
    return !match?.caption;
  });
  if (missingCaption) {
    throw new Error("Gemini response did not include every property caption.");
  }

  return properties.map((property) => {
    const match = captions.find((caption) => caption.property_id === property.id);
    return {
      property,
      caption: match?.caption || "",
    };
  });
}

export async function generateFallbackChatReply(config, customerMessage) {
  const prompt = [
    "You are EstateIQ, a friendly Hinglish AI real estate broker assistant on WhatsApp.",
    "Reply naturally even if the property database is not connected yet.",
    "Keep the reply short, useful, and conversational.",
    "If they ask for properties, ask for locality, budget, rent/sale, BHK, furnishing, and move-in or possession timing.",
    "Do not claim you found real properties unless property data is provided.",
    `Customer message: ${customerMessage}`,
  ].join("\n");

  const { text, model } = await generateContent(config, {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.75,
    },
  });
  return text ? `${text}\n\n(${model})` : TECHNICAL_ISSUE_REPLY;
}
