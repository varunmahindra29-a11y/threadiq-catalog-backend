function whatsappEndpoint(config) {
  return `https://graph.facebook.com/v19.0/${config.whatsappPhoneNumberId}/messages`;
}

async function sendWhatsapp(config, payload) {
  const response = await fetch(whatsappEndpoint(config), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.whatsappAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      ...payload,
    }),
  });

  if (!response.ok) {
    throw new Error(`WhatsApp send failed ${response.status}: ${await response.text()}`);
  }

  return response.json();
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
