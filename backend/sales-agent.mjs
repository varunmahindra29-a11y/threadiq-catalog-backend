import { generateFallbackChatReply, generateSalesCaptions, fallbackCaption } from "./gemini.mjs";
import { detectInterest, findShopByMessage, rankProducts } from "./matching.mjs";
import { createLead, listProductsForShop, listShops, logWhatsappMessage } from "./supabase.mjs";
import { sendImage, sendText } from "./whatsapp.mjs";

function getTextMessages(payload) {
  const messages = [];
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      for (const message of value.messages || []) {
        if (message.type !== "text") continue;
        messages.push({
          from: message.from,
          text: message.text?.body || "",
          rawPayload: message,
        });
      }
    }
  }
  return messages;
}

function ownerAlert(shop, customerWhatsapp, customerMessage, products) {
  const productLines = products.map((product) => `- ${product.name} (₹${Number(product.price || 0).toLocaleString("en-IN")})`).join("\n");
  return [
    `New WhatsApp lead for ${shop.name}`,
    `Customer: +${customerWhatsapp}`,
    `Message: ${customerMessage}`,
    "Matched products:",
    productLines || "- No matched products",
  ].join("\n");
}

async function sendFallbackChat(config, message, reason) {
  let reply;
  try {
    reply = await generateFallbackChatReply(config, message.text);
  } catch (error) {
    console.error(`Gemini fallback chat failed: ${error.message}`);
    reply = `Samjha bhai: "${message.text}". Main AI chat mode me hoon. Catalog connection fix hote hi products/images bhi bhej dunga, abhi aap style, budget, size ya occasion batao.`;
  }

  await sendText(config, message.from, reply);
  return { status: "fallback_chat", reason };
}

export async function handleCustomerMessage(config, message) {
  return sendFallbackChat(config, message, "ai_chat_mode");

  let shops;
  try {
    shops = await listShops(config);
  } catch (error) {
    console.error(`Supabase shops lookup failed: ${error.message}`);
    return sendFallbackChat(config, message, "catalog_unavailable");
  }

  if (!shops.length) {
    return sendFallbackChat(config, message, "no_shops");
  }

  const shop = findShopByMessage(shops, message.text);

  await logWhatsappMessage(config, {
    customerWhatsapp: message.from,
    direction: "inbound",
    body: message.text,
    rawPayload: message.rawPayload,
    shopId: shop?.id,
  });

  if (!shop) {
    const reply = await generateFallbackChatReply(config, `${message.text}\nAlso ask which shop they want, example Raj Fashion.`);
    await sendText(config, message.from, reply);
    await logWhatsappMessage(config, {
      customerWhatsapp: message.from,
      direction: "outbound",
      body: reply,
      rawPayload: null,
    });
    return { status: "shop_not_found" };
  }

  let products;
  try {
    products = await listProductsForShop(config, shop.id);
  } catch (error) {
    console.error(`Supabase products lookup failed: ${error.message}`);
    return sendFallbackChat(config, message, "products_unavailable");
  }

  const matchedProducts = rankProducts(products, message.text, 3);

  if (!matchedProducts.length) {
    const reply = await generateFallbackChatReply(config, `${message.text}\nNo matching in-stock products found for ${shop.name}. Ask a helpful follow-up.`);
    await sendText(config, message.from, reply);
    await logWhatsappMessage(config, {
      customerWhatsapp: message.from,
      direction: "outbound",
      body: reply,
      shopId: shop.id,
      rawPayload: null,
    });
    return { status: "no_products", shopId: shop.id };
  }

  let captions;
  try {
    captions = await generateSalesCaptions(config, {
      shop,
      products: matchedProducts,
      customerMessage: message.text,
    });
  } catch (error) {
    console.warn(`Gemini caption fallback: ${error.message}`);
    captions = matchedProducts.map((product) => ({
      product,
      caption: fallbackCaption(shop, product),
    }));
  }

  await sendText(config, message.from, `${shop.name} se top options bhej raha hoon. Jo pasand aaye uska size bol dena.`);
  for (const item of captions) {
    if (item.product.image_url) {
      await sendImage(config, message.from, item.product.image_url, item.caption);
    } else {
      await sendText(config, message.from, item.caption);
    }
    await logWhatsappMessage(config, {
      customerWhatsapp: message.from,
      direction: "outbound",
      body: item.caption,
      shopId: shop.id,
      rawPayload: { product_id: item.product.id },
    });
  }

  if (detectInterest(message.text)) {
    await createLead(config, {
      shopId: shop.id,
      customerWhatsapp: message.from,
      customerMessage: message.text,
      matchedProductIds: matchedProducts.map((product) => product.id),
    });

    if (shop.owner_whatsapp) {
      await sendText(config, shop.owner_whatsapp, ownerAlert(shop, message.from, message.text, matchedProducts));
    }
    await sendText(config, message.from, "Done bhai, maine shop owner ko lead bhej di hai. Aap size/color confirm kar do to process fast ho jayega.");
  }

  return {
    status: "sent_products",
    shopId: shop.id,
    productIds: matchedProducts.map((product) => product.id),
  };
}

export async function handleWhatsappPayload(config, payload) {
  const messages = getTextMessages(payload);
  const results = [];
  for (const message of messages) {
    try {
      results.push(await handleCustomerMessage(config, message));
    } catch (error) {
      console.error(`Message handling failed: ${error.message}`);
      try {
        await sendText(config, message.from, "Bhai bot me temporary issue aa gaya. Aap message dobara bhejo ya shop owner se direct connect karwa denge.");
      } catch (sendError) {
        console.error(`Fallback WhatsApp send failed: ${sendError.message}`);
      }
      results.push({ status: "message_failed" });
    }
  }
  return results;
}
