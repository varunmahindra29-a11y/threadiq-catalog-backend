function createHeaders(serviceRoleKey) {
  const headers = {
    apikey: serviceRoleKey,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
  if (!serviceRoleKey.startsWith("sb_")) {
    headers.Authorization = `Bearer ${serviceRoleKey}`;
  }
  return headers;
}

function endpoint(config, path) {
  return `${config.supabaseUrl.replace(/\/$/, "")}/rest/v1/${path}`;
}

async function request(config, path, options = {}) {
  const response = await fetch(endpoint(config, path), {
    ...options,
    headers: {
      ...createHeaders(config.supabaseServiceRoleKey),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase request failed ${response.status}: ${body}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export async function listShops(config) {
  return request(config, "shops?select=*&order=name.asc");
}

export async function listProductsForShop(config, shopId) {
  const params = new URLSearchParams({
    select: "*",
    shop_id: `eq.${shopId}`,
    status: "eq.active",
    stock: "gt.0",
    order: "inquiries.desc,created_at.desc",
  });
  return request(config, `products?${params.toString()}`);
}

export async function createLead(config, lead) {
  const rows = await request(config, "leads", {
    method: "POST",
    body: JSON.stringify({
      shop_id: lead.shopId,
      customer_whatsapp: lead.customerWhatsapp,
      customer_message: lead.customerMessage,
      matched_product_ids: lead.matchedProductIds,
      status: lead.status || "new",
    }),
  });
  return rows?.[0] || null;
}

export async function logWhatsappMessage(config, message) {
  try {
    await request(config, "whatsapp_messages", {
      method: "POST",
      body: JSON.stringify({
        shop_id: message.shopId || null,
        customer_whatsapp: message.customerWhatsapp,
        direction: message.direction,
        body: message.body,
        raw_payload: message.rawPayload || null,
      }),
    });
  } catch (error) {
    console.warn(`Skipping whatsapp_messages log: ${error.message}`);
  }
}
