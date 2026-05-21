import { generateSalesCaptions, fallbackCaption } from "./gemini.mjs";
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

export async function handleCustomerMessage(config, message) {
  const shops = await listShops(config);
  const shop = findShopByMessage(shops, message.text);

  await logWhatsappMessage(config, {
    customerWhatsapp: message.from,
    direction: "inbound",
    body: message.text,
    rawPayload: message.rawPayload,
    shopId: shop?.id,
  });

  if (!shop) {
    const reply = "Bhai kis shop ke products dekhne hain? Example: “Raj Fashion ke black shirts dikhao”.";
    await sendText(config, message.from, reply);
    await logWhatsappMessage(config, {
      customerWhatsapp: message.from,
      direction: "outbound",
      body: reply,
      rawPayload: null,
    });
    return { status: "shop_not_found" };
  }

  const products = await listProductsForShop(config, shop.id);
  const matchedProducts = rankProducts(products, message.text, 3);

  if (!matchedProducts.length) {
    const reply = `${shop.name} me abhi matching in-stock products nahi mile. Aap category, color ya budget thoda aur bata do?`;
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
    results.push(await handleCustomerMessage(config, message));
  }
  return results;
}
