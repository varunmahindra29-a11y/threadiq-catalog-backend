import { recordEvent } from "./debug-events.mjs";

function whatsappEndpoint(config) {
  return `https://graph.facebook.com/v19.0/${config.whatsappPhoneNumberId}/messages`;
}

async function sendWhatsapp(config, payload) {
  const fullPayload = {
    messaging_product: "whatsapp",
    ...payload,
  };
  const response = await fetch(whatsappEndpoint(config), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.whatsappAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(fullPayload),
  });

  if (!response.ok) {
    const detail = await response.text();
    recordEvent("whatsapp_send_failed", {
      to: fullPayload.to,
      type: fullPayload.type,
      status: response.status,
      detail: detail.slice(0, 500),
    });
    throw new Error(`WhatsApp send failed ${response.status}: ${detail}`);
  }

  const result = await response.json();
  recordEvent("whatsapp_send_ok", {
    to: fullPayload.to,
    type: fullPayload.type,
    messageId: result?.messages?.[0]?.id,
  });
  return result;
}

export function normalizeWhatsappNumber(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

export async function sendText(config, to, body) {
  return sendWhatsapp(config, {
    to: normalizeWhatsappNumber(to),
    type: "text",
    text: {
      preview_url: false,
      body,
    },
  });
}

export async function sendImage(config, to, imageUrl, caption) {
  return sendWhatsapp(config, {
    to: normalizeWhatsappNumber(to),
    type: "image",
    image: {
      link: imageUrl,
      caption,
    },
  });
}
