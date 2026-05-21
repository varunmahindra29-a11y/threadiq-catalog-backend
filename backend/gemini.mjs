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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.geminiModel)}:generateContent?key=${encodeURIComponent(config.geminiApiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
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
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed ${response.status}: ${await response.text()}`);
  }

  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
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
