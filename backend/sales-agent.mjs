import { fallbackProperties, fallbackShop } from "./fallback-properties.mjs";
import { generateFallbackChatReply, generatePropertyCaptions, generateShortBrokerReply, TECHNICAL_ISSUE_REPLY } from "./gemini.mjs";
import { detectInterest, findShopByMessage, rankProperties } from "./matching.mjs";
import { createLead, listPropertiesForShop, listShops, logWhatsappMessage } from "./supabase.mjs";
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

function priceLine(property) {
  const price = Number(property.price || 0).toLocaleString("en-IN");
  return property.listing_type === "rent" ? `Rs ${price}/month` : `Rs ${price}`;
}

function ownerAlert(shop, customerWhatsapp, customerMessage, properties) {
  const propertyLines = properties
    .map((property) => `- ${property.title || property.name} (${property.locality || property.city}, ${priceLine(property)})`)
    .join("\n");
  return [
    `New EstateIQ lead for ${shop.name}`,
    `Customer: +${customerWhatsapp}`,
    `Requirement: ${customerMessage}`,
    "Matched properties:",
    propertyLines || "- No matched properties",
    "Next step: call back or schedule a site visit.",
  ].join("\n");
}

function wantsProperties(messageText) {
  return /\b(estateiq|realty|property|properties|flat|apartment|ghar|house|villa|studio|plot|rent|rental|sale|buy|purchase|bhk|bedroom|furnished|unfurnished|locality|andheri|powai|noida|gurgaon|gurugram|bandra|whitefield|budget|under|visit|call|broker)\b/i.test(
    messageText,
  );
}

function publicPropertyImageUrl(config, imageUrl) {
  if (!imageUrl) return "";
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  if (!config.publicBaseUrl) return "";
  return new URL(imageUrl, `${config.publicBaseUrl.replace(/\/$/, "")}/`).href;
}

async function sendFallbackChat(config, message, reason) {
  let reply;
  try {
    reply = await generateFallbackChatReply(config, message.text);
  } catch (error) {
    console.error(`Gemini fallback chat failed: ${error.message}`);
    reply = TECHNICAL_ISSUE_REPLY;
  }

  await sendText(config, message.from, reply);
  return { status: "fallback_chat", reason };
}

export async function handleCustomerMessage(config, message) {
  if (!wantsProperties(message.text)) {
    return sendFallbackChat(config, message, "ai_chat_mode");
  }

  let shops;
  try {
    shops = await listShops(config);
  } catch (error) {
    console.error(`Supabase broker lookup failed: ${error.message}`);
    shops = [fallbackShop()];
  }

  if (!shops.length) {
    shops = [fallbackShop()];
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
    const reply = await generateFallbackChatReply(config, `${message.text}\nAlso ask which broker or agency they want, example EstateIQ Demo Realty.`);
    await sendText(config, message.from, reply);
    await logWhatsappMessage(config, {
      customerWhatsapp: message.from,
      direction: "outbound",
      body: reply,
      rawPayload: null,
    });
    return { status: "broker_not_found" };
  }

  let properties;
  try {
    properties = await listPropertiesForShop(config, shop.id);
  } catch (error) {
    console.error(`Supabase properties lookup failed: ${error.message}`);
    properties = fallbackProperties(config, shop.id);
  }

  if (!properties.length) {
    properties = fallbackProperties(config, shop.id);
  }

  const matchedProperties = rankProperties(properties, message.text, 3);

  if (!matchedProperties.length) {
    const reply = await generateFallbackChatReply(config, `${message.text}\nNo matching active properties found for ${shop.name}. Ask for locality, budget, BHK, rent/sale, and timing.`);
    await sendText(config, message.from, reply);
    await logWhatsappMessage(config, {
      customerWhatsapp: message.from,
      direction: "outbound",
      body: reply,
      shopId: shop.id,
      rawPayload: null,
    });
    return { status: "no_properties", shopId: shop.id };
  }

  let captions;
  try {
    captions = await generatePropertyCaptions(config, {
      shop,
      properties: matchedProperties,
      customerMessage: message.text,
    });
  } catch (error) {
    console.warn(`Gemini property caption fallback: ${error.message}`);
    const reply = await generateFallbackChatReply(config, `${message.text}\nProperty caption generation failed. Ask for locality, budget, BHK, rent/sale, and visit timing without claiming matches.`);
    await sendText(config, message.from, reply);
    await logWhatsappMessage(config, {
      customerWhatsapp: message.from,
      direction: "outbound",
      body: reply,
      shopId: shop.id,
      rawPayload: null,
    });
    return { status: "ai_caption_failed", shopId: shop.id };
  }

  const introReply = await generateShortBrokerReply(config, {
    shop,
    customerMessage: message.text,
    purpose: "Tell the customer that matching property options are being shared now and ask them to pick one for callback or site visit.",
    properties: matchedProperties,
  });
  await sendText(config, message.from, introReply);
  await logWhatsappMessage(config, {
    customerWhatsapp: message.from,
    direction: "outbound",
    body: introReply,
    shopId: shop.id,
    rawPayload: { type: "ai_intro" },
  });
  for (const item of captions) {
    const publicImageUrl = publicPropertyImageUrl(config, item.property.image_url);
    const captionWithLink = item.property.image_url ? `${item.caption}\n\nImage: ${publicImageUrl || item.property.image_url}` : item.caption;
    try {
      if (publicImageUrl) {
        await sendImage(config, message.from, publicImageUrl, item.caption);
      } else {
        await sendText(config, message.from, captionWithLink);
      }
    } catch (error) {
      console.error(`Property image send failed: ${error.message}`);
      await sendText(config, message.from, captionWithLink);
    }
    await logWhatsappMessage(config, {
      customerWhatsapp: message.from,
      direction: "outbound",
      body: captionWithLink,
      shopId: shop.id,
      rawPayload: { property_id: item.property.id },
    });
  }

  if (detectInterest(message.text)) {
    try {
      await createLead(config, {
        shopId: shop.id,
        customerWhatsapp: message.from,
        customerMessage: message.text,
        matchedPropertyIds: matchedProperties.map((property) => property.id),
        intent: "site_visit",
      });

      if (shop.owner_whatsapp) {
        await sendText(config, shop.owner_whatsapp, ownerAlert(shop, message.from, message.text, matchedProperties));
      }
    } catch (error) {
      console.warn(`Skipping lead capture: ${error.message}`);
    }
    const handoffReply = await generateShortBrokerReply(config, {
      shop,
      customerMessage: message.text,
      purpose: "Confirm the lead has been shared with the broker and ask for preferred callback or site visit time.",
      properties: matchedProperties,
    });
    await sendText(config, message.from, handoffReply);
    await logWhatsappMessage(config, {
      customerWhatsapp: message.from,
      direction: "outbound",
      body: handoffReply,
      shopId: shop.id,
      rawPayload: { type: "ai_lead_handoff" },
    });
  }

  return {
    status: "sent_properties",
    shopId: shop.id,
    propertyIds: matchedProperties.map((property) => property.id),
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
        await sendText(config, message.from, TECHNICAL_ISSUE_REPLY);
      } catch (sendError) {
        console.error(`Fallback WhatsApp send failed: ${sendError.message}`);
      }
      results.push({ status: "message_failed" });
    }
  }
  return results;
}
