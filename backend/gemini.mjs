function compactProduct(product) {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    price: Number(product.price || 0),
    stock: Number(product.stock || 0),
    sizes: product.sizes || [],
    colors: product.colors || [],
  };
}

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

export function fallbackCaption(shop, product) {
  const sizes = Array.isArray(product.sizes) && product.sizes.length ? product.sizes.join(", ") : "size confirm kar denge";
  const colors = Array.isArray(product.colors) && product.colors.length ? product.colors.join(", ") : "available color";
  return `${product.name}\nPrice: ₹${Number(product.price || 0).toLocaleString("en-IN")}\nSizes: ${sizes}\nColors: ${colors}\n${shop.name} se ye piece kaafi smart lagega. Interested ho to size bata do, main owner ko connect kara deta hoon.`;
}

export async function generateSalesCaptions(config, { shop, products, customerMessage }) {
  const prompt = [
    "You are a friendly Hinglish clothing shop salesman on WhatsApp.",
    `Shop name: ${shop.name}`,
    `Shop tone: ${shop.tone || "friendly, confident, helpful"}`,
    "Use only the product facts provided. Never invent stock, prices, sizes, colors, discounts, or delivery promises.",
    "Return strict JSON only: {\"captions\":[{\"product_id\":\"...\",\"caption\":\"...\"}]}",
    "Each caption must be short, sales-focused, and include product name, price, sizes/colors if available, plus one helpful pitch.",
    `Customer message: ${customerMessage}`,
    `Products: ${JSON.stringify(products.map(compactProduct))}`,
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

  return products.map((product) => {
    const match = captions.find((caption) => caption.product_id === product.id);
    return {
      product,
      caption: match?.caption || fallbackCaption(shop, product),
    };
  });
}

export async function generateFallbackChatReply(config, customerMessage) {
  const prompt = [
    "You are ThreadIQ, a friendly Hinglish AI fashion salesman on WhatsApp.",
    "Reply naturally to the customer even if the shop catalog is not connected yet.",
    "Keep the reply short, useful, and conversational.",
    "If they ask for products, say catalog connection is being fixed and ask for their style, budget, size, or occasion.",
    "Do not claim you found real products unless product data is provided.",
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
  return text ? `${text}\n\n(${model})` : "Haan bhai, ThreadIQ AI live hai. Catalog connection fix hote hi main real products aur images bhi bhej dunga.";
}
