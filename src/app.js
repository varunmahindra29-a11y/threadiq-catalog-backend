import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase-config.js";

const demoProducts = [
  {
    id: crypto.randomUUID(),
    name: "Black Oversized Shirt",
    category: "Shirts",
    price: 1499,
    stock: 16,
    sizes: ["M", "L", "XL"],
    colors: ["Black"],
    image_url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=80",
    status: "active",
    inquiries: 46,
    orders: 13,
  },
  {
    id: crypto.randomUUID(),
    name: "Ivory Linen Co-ord",
    category: "Co-ords",
    price: 2299,
    stock: 8,
    sizes: ["S", "M", "L"],
    colors: ["Ivory", "Beige"],
    image_url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
    status: "active",
    inquiries: 33,
    orders: 8,
  },
  {
    id: crypto.randomUUID(),
    name: "Washed Denim Jacket",
    category: "Jackets",
    price: 2799,
    stock: 5,
    sizes: ["M", "L"],
    colors: ["Blue"],
    image_url: "https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=900&q=80",
    status: "active",
    inquiries: 27,
    orders: 6,
  },
  {
    id: crypto.randomUUID(),
    name: "Sage Relaxed Trousers",
    category: "Trousers",
    price: 1899,
    stock: 3,
    sizes: ["30", "32", "34"],
    colors: ["Sage", "Green"],
    image_url: "https://images.unsplash.com/photo-1506629905607-d405b7a30db9?auto=format&fit=crop&w=900&q=80",
    status: "active",
    inquiries: 21,
    orders: 4,
  },
  {
    id: crypto.randomUUID(),
    name: "Rust Party Kurta",
    category: "Ethnic",
    price: 1699,
    stock: 11,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Rust", "Orange"],
    image_url: "https://images.unsplash.com/photo-1614251056216-f748f76cd228?auto=format&fit=crop&w=900&q=80",
    status: "active",
    inquiries: 18,
    orders: 5,
  },
  {
    id: crypto.randomUUID(),
    name: "White Minimal Sneakers",
    category: "Footwear",
    price: 2499,
    stock: 22,
    sizes: ["7", "8", "9", "10"],
    colors: ["White"],
    image_url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80",
    status: "active",
    inquiries: 40,
    orders: 14,
  },
];

const leadSeries = {
  7: [18, 24, 20, 29, 34, 31, 42],
  14: [12, 14, 16, 15, 19, 22, 20, 24, 26, 27, 32, 31, 35, 42],
  30: [6, 8, 9, 10, 12, 13, 13, 15, 16, 16, 18, 20, 22, 21, 24, 25, 24, 27, 28, 30, 29, 32, 33, 31, 34, 36, 37, 39, 40, 42],
};

const demoLeads = [
  {
    id: "demo-lead-1",
    customer_whatsapp: "919876543210",
    customer_message: "black shirt under 2000 L size chahiye",
    matched_product_names: ["Black Oversized Shirt"],
    status: "new",
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-lead-2",
    customer_whatsapp: "918888777666",
    customer_message: "party ke liye kurta dikhao",
    matched_product_names: ["Rust Party Kurta"],
    status: "follow_up",
    created_at: new Date(Date.now() - 1000 * 60 * 52).toISOString(),
  },
  {
    id: "demo-lead-3",
    customer_whatsapp: "917777666555",
    customer_message: "white sneakers available hai kya",
    matched_product_names: ["White Minimal Sneakers"],
    status: "new",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
];

const state = {
  products: [],
  leads: [],
  leadMessages: [],
  selectedLeadId: "",
  inventoryPage: 1,
  inventoryPageSize: 8,
  lowStockOnly: false,
  defaultShopId: "",
  config: {
    url: SUPABASE_URL,
    key: SUPABASE_ANON_KEY,
  },
  activePanel: "dashboard",
};

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function loadLocalState() {
  state.products = demoProducts;
  state.leads = demoLeads.map(normalizeLead);
}

function hasSupabaseConfig() {
  return Boolean(state.config.url && state.config.key);
}

function supabaseHeaders() {
  return {
    apikey: state.config.key,
    Authorization: `Bearer ${state.config.key}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

async function fetchSupabaseProducts() {
  try {
    const localResponse = await fetch("/api/products");
    if (localResponse.ok) {
      const result = await localResponse.json();
      state.defaultShopId = result.shop_id || state.defaultShopId;
      state.products = Array.isArray(result.products) ? result.products.map(normalizeProduct) : [];
      return;
    }
    if (localResponse.status !== 404) {
      throw new Error("Local products API failed");
    }
  } catch {
    // Fall back to browser-side Supabase for deployments without the local API.
  }

  if (!hasSupabaseConfig()) {
    updateSyncButton("Supabase config missing");
    return;
  }
  const params = new URLSearchParams({
    select: "*",
    order: "created_at.desc",
  });
  if (state.defaultShopId) {
    params.set("shop_id", `eq.${state.defaultShopId}`);
  }
  const endpoint = `${state.config.url.replace(/\/$/, "")}/rest/v1/products?${params.toString()}`;
  const response = await fetch(endpoint, { headers: supabaseHeaders() });
  if (!response.ok) throw new Error("Supabase products fetch failed");
  const rows = await response.json();
  if (Array.isArray(rows)) {
    state.products = rows.map(normalizeProduct);
  }
}

async function fetchDefaultShopId() {
  if (!hasSupabaseConfig()) return "";
  const endpoint = `${state.config.url.replace(/\/$/, "")}/rest/v1/shops?select=id&slug=eq.raj-fashion&limit=1`;
  const response = await fetch(endpoint, { headers: supabaseHeaders() });
  if (!response.ok) return "";
  const rows = await response.json();
  state.defaultShopId = rows?.[0]?.id || "";
  return state.defaultShopId;
}

async function fetchLeads() {
  try {
    const response = await fetch("/api/leads");
    if (!response.ok) throw new Error("Leads API failed");
    const result = await response.json();
    state.leads = Array.isArray(result.leads) ? result.leads.map(normalizeLead) : [];
    state.leadMessages = Array.isArray(result.messages) ? result.messages.map(normalizeMessage) : [];
    state.selectedLeadId = state.leads[0]?.id || "";
  } catch {
    if (!state.leads.length) {
      state.leads = demoLeads.map(normalizeLead);
      state.selectedLeadId = state.leads[0]?.id || "";
    }
  }
}

async function insertSupabaseProduct(product) {
  try {
    const localResponse = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    if (localResponse.ok) {
      const result = await localResponse.json();
      state.defaultShopId = result.shop_id || state.defaultShopId;
      return normalizeProduct(result.product || product);
    }
    if (localResponse.status !== 404) {
      const result = await localResponse.json().catch(() => ({}));
      throw new Error(result.error || "Local product publish failed");
    }
  } catch {
    throw new Error("Local product publish failed");
  }

  if (!hasSupabaseConfig()) {
    throw new Error("Supabase config missing");
  }
  if (!state.defaultShopId) {
    await fetchDefaultShopId();
  }
  if (!state.defaultShopId) {
    throw new Error("Default shop missing");
  }
  const endpoint = `${state.config.url.replace(/\/$/, "")}/rest/v1/products`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: supabaseHeaders(),
    body: JSON.stringify({
      shop_id: state.defaultShopId,
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      stock: product.stock,
      sizes: product.sizes,
      colors: product.colors,
      image_url: product.image_url,
      status: product.status,
      inquiries: product.inquiries,
      orders: product.orders,
    }),
  });
  if (!response.ok) throw new Error("Supabase product insert failed");
  const rows = await response.json();
  return rows[0] ? normalizeProduct(rows[0]) : product;
}

async function updateSupabaseProduct(product) {
  const response = await fetch(`/api/products?id=${encodeURIComponent(product.id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });
  if (!response.ok) throw new Error("Product update failed");
  const result = await response.json();
  return normalizeProduct(result.product || product);
}

async function deleteSupabaseProduct(productId) {
  const response = await fetch(`/api/products?id=${encodeURIComponent(productId)}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Product delete failed");
}

function normalizeProduct(product) {
  return {
    id: product.id || crypto.randomUUID(),
    name: product.name || "Untitled product",
    description: product.description || "",
    category: product.category || "General",
    price: Number(product.price || 0),
    stock: Number(product.stock || 0),
    sizes: Array.isArray(product.sizes) ? product.sizes : splitList(product.sizes),
    colors: Array.isArray(product.colors) ? product.colors : splitList(product.colors),
    image_url: product.image_url || "",
    status: product.status || "active",
    inquiries: Number(product.inquiries || 0),
    orders: Number(product.orders || 0),
  };
}

function normalizeLead(lead) {
  return {
    id: lead.id || crypto.randomUUID(),
    customer_whatsapp: lead.customer_whatsapp || "",
    customer_message: lead.customer_message || "",
    matched_product_ids: Array.isArray(lead.matched_product_ids) ? lead.matched_product_ids : splitList(lead.matched_product_ids),
    matched_product_names: Array.isArray(lead.matched_product_names) ? lead.matched_product_names : splitList(lead.matched_product_names),
    status: lead.status || "new",
    created_at: lead.created_at || new Date().toISOString(),
  };
}

function normalizeMessage(message) {
  return {
    id: message.id || crypto.randomUUID(),
    customer_whatsapp: message.customer_whatsapp || "",
    direction: message.direction || "inbound",
    body: message.body || "",
    created_at: message.created_at || new Date().toISOString(),
  };
}

function splitList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function renderAll() {
  updateSyncButton(hasSupabaseConfig() ? "Supabase connected" : "Supabase config missing");
  renderMetrics();
  renderCategoryFilter();
  renderProducts();
  renderCategoryBars();
  renderHealth();
  renderHotLeads();
  renderLeadInbox();
  drawChart();
}

function renderMetrics() {
  const revenue = state.products.reduce((sum, product) => sum + product.price * product.orders, 0);
  const inquiries = state.products.reduce((sum, product) => sum + product.inquiries, 0);
  const orders = state.products.reduce((sum, product) => sum + product.orders, 0);
  const lowStock = state.products.filter((product) => product.stock <= 5).length;
  const conversion = inquiries ? Math.round((orders / inquiries) * 100) : 0;

  $("#metricRevenue").textContent = currency.format(revenue);
  $("#metricProducts").textContent = state.products.length;
  $("#metricConversion").textContent = `${conversion}%`;
  $("#metricLowStock").textContent = lowStock;
  $("#todayLeads").textContent = `${state.leads.length || leadSeries[7].at(-1)} leads`;
}

function renderCategoryFilter() {
  const current = $("#categoryFilter").value;
  const categories = uniqueCategories();
  $("#categoryFilter").innerHTML = [
    `<option value="all">All categories</option>`,
    ...categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`),
  ].join("");
  $("#categoryFilter").value = categories.includes(current) ? current : "all";
}

function renderProducts() {
  const query = $("#searchInput").value.trim().toLowerCase();
  const category = $("#categoryFilter").value;
  const products = state.products.filter((product) => {
    const haystack = [
      product.name,
      product.category,
      product.colors.join(" "),
      product.sizes.join(" "),
      product.price,
    ]
      .join(" ")
      .toLowerCase();
    return (
      haystack.includes(query) &&
      (category === "all" || product.category === category) &&
      (!state.lowStockOnly || product.stock <= 5)
    );
  });
  const pageCount = Math.max(Math.ceil(products.length / state.inventoryPageSize), 1);
  state.inventoryPage = Math.min(state.inventoryPage, pageCount);
  const start = (state.inventoryPage - 1) * state.inventoryPageSize;
  const visibleProducts = products.slice(start, start + state.inventoryPageSize);

  $("#productGrid").innerHTML = visibleProducts.length
    ? visibleProducts.map(renderProductCard).join("")
    : `<div class="empty-state">No products match this filter yet.</div>`;
  $("#listingCount").textContent = products.length
    ? `Showing ${start + 1}-${Math.min(start + state.inventoryPageSize, products.length)} of ${products.length} products`
    : "No products found";
  renderProductPager(pageCount);
}

function renderProductCard(product) {
  const image = product.image_url || "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=80";
  const tags = [...product.sizes.slice(0, 1), ...product.colors.slice(0, 1)];
  return `
    <article class="product-card catalog-card">
      <div class="product-media">
        <img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" loading="lazy" />
        <button class="favorite-button" type="button" aria-label="Save ${escapeHtml(product.name)}">♡</button>
        <div class="product-actions">
          <button type="button" data-edit-product="${escapeHtml(product.id)}">Edit</button>
          <button type="button" data-delete-product="${escapeHtml(product.id)}">Delete</button>
        </div>
      </div>
      <div class="product-content">
        <div class="product-title">
          <strong>${escapeHtml(product.name)}</strong>
          <span class="price">${currency.format(product.price)}</span>
        </div>
        <small>${product.stock} in stock · ${product.inquiries} inquiries</small>
        <div class="tag-list">
          ${tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
          <span class="tag category-tag">${escapeHtml(product.category)}</span>
        </div>
      </div>
    </article>
  `;
}

function renderProductPager(pageCount) {
  const buttons = [];
  buttons.push(`<button type="button" data-page-step="-1" ${state.inventoryPage === 1 ? "disabled" : ""}>‹</button>`);
  for (let page = 1; page <= pageCount; page += 1) {
    if (pageCount > 6 && page > 3 && page < pageCount) {
      if (page === 4) buttons.push(`<span>...</span>`);
      continue;
    }
    buttons.push(`<button class="${page === state.inventoryPage ? "active" : ""}" type="button" data-page="${page}">${page}</button>`);
  }
  buttons.push(`<button type="button" data-page-step="1" ${state.inventoryPage === pageCount ? "disabled" : ""}>›</button>`);
  $("#productPager").innerHTML = buttons.join("");
}

function renderCategoryBars() {
  const totals = uniqueCategories().map((category) => ({
    category,
    value: state.products
      .filter((product) => product.category === category)
      .reduce((sum, product) => sum + product.inquiries, 0),
  }));
  const max = Math.max(...totals.map((item) => item.value), 1);
  const total = Math.max(totals.reduce((sum, item) => sum + item.value, 0), 1);
  $("#categoryBars").innerHTML = totals
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map(
      (item, index) => `
      <div class="bar-row">
        <header>
          <span>${index + 1}</span>
          <strong>${escapeHtml(item.category)}</strong>
          <em>${item.value} (${Math.round((item.value / total) * 100)}%)</em>
        </header>
        <div class="bar-track"><div class="bar-fill" style="width: ${(item.value / max) * 100}%"></div></div>
      </div>
    `,
    )
    .join("");
}

function renderHealth() {
  const sorted = [...state.products]
    .sort((a, b) => a.stock - b.stock || b.inquiries - a.inquiries)
    .slice(0, 4);
  $("#healthList").innerHTML = `
    <div class="health-table" role="table" aria-label="Listing health">
      <div class="health-row head" role="row">
        <span>Product</span>
        <span>Issue</span>
        <span>Priority</span>
        <span>Suggested Action</span>
        <span>Status</span>
        <span>Action</span>
      </div>
      ${sorted.map(renderHealthRow).join("")}
    </div>
  `;
}

function renderHealthRow(product) {
  const needsRestock = product.stock <= 5;
  const missingImage = !product.image_url;
  const issue = missingImage ? "Missing product image" : needsRestock ? "Low stock risk" : product.sizes.length ? "Boost WhatsApp demand" : "Missing size options";
  const priority = missingImage || needsRestock ? "High" : product.sizes.length ? "Low" : "Medium";
  const status = missingImage || needsRestock ? "Needs Attention" : product.sizes.length ? "Pending" : "In Progress";
  const action = missingImage
    ? "Add clear front and back photos"
    : needsRestock
      ? "Restock or pause recommendations"
      : product.sizes.length
        ? "Promote in WhatsApp replies"
        : "Add all available sizes";
  return `
    <div class="health-row" role="row">
      <span class="health-product">
        <img src="${escapeHtml(product.image_url || "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=80")}" alt="${escapeHtml(product.name)}" />
        <span>
          <strong>${escapeHtml(product.name)}</strong>
          <small>ID: PRD-${escapeHtml(String(product.id).slice(0, 6).toUpperCase())}</small>
        </span>
      </span>
      <span>${escapeHtml(issue)}</span>
      <span><mark class="priority ${priority.toLowerCase()}">${escapeHtml(priority)}</mark></span>
      <span>${escapeHtml(action)}</span>
      <span><mark class="status-badge ${status.toLowerCase().replace(/\s+/g, "-")}">${escapeHtml(status)}</mark></span>
      <span><button class="table-action" data-open-listing type="button">Fix Listing</button></span>
    </div>
  `;
}

function renderHotLeads() {
  const leads = [...state.leads]
    .sort((a, b) => leadIntentScore(b) - leadIntentScore(a))
    .slice(0, 3);
  $("#hotLeadList").innerHTML = leads.length
    ? leads
        .map((lead) => {
          const products = leadProducts(lead).slice(0, 2);
          return `
            <button class="hot-lead-card" data-lead-id="${escapeHtml(lead.id)}" type="button">
              <span class="lead-avatar">${escapeHtml(customerInitial(lead.customer_whatsapp))}</span>
              <span>
                <strong>+${escapeHtml(maskPhone(lead.customer_whatsapp))}</strong>
                <small>${escapeHtml(lead.customer_message)}</small>
              </span>
              <em>${products.length ? products.map((product) => escapeHtml(product.name)).join(", ") : "Needs review"}</em>
            </button>
          `;
        })
        .join("")
    : `<div class="empty-state">WhatsApp leads will appear here after customers ask for products.</div>`;
}

function renderLeadInbox() {
  renderLeadMetrics();
  renderLeadList();
  renderLeadDetail();
}

function renderLeadMetrics() {
  const open = state.leads.filter((lead) => lead.status !== "closed").length;
  const hot = state.leads.filter((lead) => leadIntentScore(lead) >= 70).length;
  const today = state.leads.filter((lead) => new Date(lead.created_at).toDateString() === new Date().toDateString()).length;
  $("#leadOpenCount").textContent = open;
  $("#leadHotCount").textContent = hot;
  $("#leadTodayCount").textContent = today;
}

function renderLeadList() {
  const query = $("#leadSearchInput")?.value.trim().toLowerCase() || "";
  const status = $("#leadStatusFilter")?.value || "all";
  const leads = state.leads.filter((lead) => {
    const products = leadProducts(lead).map((product) => product.name).join(" ");
    const text = `${lead.customer_whatsapp} ${lead.customer_message} ${products} ${lead.status}`.toLowerCase();
    return text.includes(query) && (status === "all" || lead.status === status);
  });

  if (!state.selectedLeadId || !leads.some((lead) => lead.id === state.selectedLeadId)) {
    state.selectedLeadId = leads[0]?.id || state.leads[0]?.id || "";
  }

  $("#leadList").innerHTML = leads.length
    ? leads
        .map((lead) => {
          const products = leadProducts(lead);
          return `
            <button class="lead-item ${lead.id === state.selectedLeadId ? "active" : ""}" data-lead-id="${escapeHtml(lead.id)}" type="button">
              <span class="lead-avatar">${escapeHtml(customerInitial(lead.customer_whatsapp))}</span>
              <span class="lead-item-body">
                <span class="lead-line">
                  <strong>+${escapeHtml(maskPhone(lead.customer_whatsapp))}</strong>
                  <em>${formatTime(lead.created_at)}</em>
                </span>
                <small>${escapeHtml(lead.customer_message)}</small>
                <span class="lead-tags">
                  <span class="status-chip ${lead.status === "new" ? "" : "warning"}">${escapeHtml(statusLabel(lead.status))}</span>
                  <span>${products.length || lead.matched_product_names.length} matches</span>
                </span>
              </span>
            </button>
          `;
        })
        .join("")
    : `<div class="empty-state">No leads match this filter yet.</div>`;
}

function renderLeadDetail() {
  const lead = state.leads.find((item) => item.id === state.selectedLeadId);
  if (!lead) {
    $("#leadDetail").innerHTML = `<div class="empty-state">Select a lead to see customer intent, matched products, and reply context.</div>`;
    return;
  }

  const products = leadProducts(lead);
  const messages = leadMessages(lead).slice(0, 5);
  const replyText = encodeURIComponent(`Hi, ${products[0]?.name || "selected product"} ke liye aapka size confirm kar dijiye.`);
  const whatsappUrl = `https://wa.me/${encodeURIComponent(lead.customer_whatsapp)}?text=${replyText}`;

  $("#leadDetail").innerHTML = `
    <div class="lead-detail-head">
      <div>
        <span class="muted-label">Customer</span>
        <h2>+${escapeHtml(maskPhone(lead.customer_whatsapp))}</h2>
        <p>${escapeHtml(lead.customer_message)}</p>
      </div>
      <a class="primary-button link-button" href="${whatsappUrl}" target="_blank" rel="noreferrer">Reply</a>
    </div>

    <div class="intent-meter" aria-label="Lead intent score">
      <span style="width: ${leadIntentScore(lead)}%"></span>
    </div>

    <div class="lead-insight-grid">
      <div>
        <span class="muted-label">Intent</span>
        <strong>${leadIntentScore(lead)} / 100</strong>
      </div>
      <div>
        <span class="muted-label">Status</span>
        <strong>${escapeHtml(statusLabel(lead.status))}</strong>
      </div>
      <div>
        <span class="muted-label">Received</span>
        <strong>${formatTime(lead.created_at)}</strong>
      </div>
    </div>

    <section class="detail-block">
      <span class="muted-label">AI matched products</span>
      <div class="lead-product-list">
        ${renderLeadProducts(products, lead)}
      </div>
    </section>

    <section class="detail-block">
      <span class="muted-label">Conversation trail</span>
      <div class="lead-timeline">
        ${messages.length ? messages.map(renderLeadMessage).join("") : `<p>No message history logged yet.</p>`}
      </div>
    </section>
  `;
}

function renderLeadProducts(products, lead) {
  if (!products.length && lead.matched_product_names.length) {
    return lead.matched_product_names.map((name) => `<div class="lead-product-fallback">${escapeHtml(name)}</div>`).join("");
  }
  if (!products.length) return `<div class="lead-product-fallback">No matched product stored yet.</div>`;
  return products
    .map(
      (product) => `
        <article class="lead-product">
          <img src="${escapeHtml(product.image_url || "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=80")}" alt="${escapeHtml(product.name)}" />
          <div>
            <strong>${escapeHtml(product.name)}</strong>
            <small>${escapeHtml(product.category)} · ${currency.format(product.price)} · ${product.stock} stock</small>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderLeadMessage(message) {
  return `
    <div class="timeline-row ${message.direction}">
      <strong>${message.direction === "inbound" ? "Customer" : "AI"}</strong>
      <span>${escapeHtml(message.body)}</span>
    </div>
  `;
}

function drawChart() {
  const canvas = $("#leadsChart");
  const ctx = canvas.getContext("2d");
  const range = $("#rangeFilter").value;
  const data = leadSeries[range];
  const width = canvas.width;
  const height = canvas.height;
  const padding = 36;
  const max = Math.max(...data) + 8;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#e4e7ec";
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i += 1) {
    const y = padding + ((height - padding * 2) / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }

  const points = data.map((value, index) => {
    const x = padding + ((width - padding * 2) / (data.length - 1)) * index;
    const y = height - padding - (value / max) * (height - padding * 2);
    return { x, y, value };
  });

  const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
  gradient.addColorStop(0, "rgba(14, 124, 102, 0.28)");
  gradient.addColorStop(1, "rgba(14, 124, 102, 0)");

  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.lineTo(points.at(-1).x, height - padding);
  ctx.lineTo(points[0].x, height - padding);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.strokeStyle = "#0e7c66";
  ctx.lineWidth = 4;
  ctx.lineJoin = "round";
  ctx.stroke();

  points.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "#0e7c66";
    ctx.lineWidth = 3;
    ctx.stroke();
  });
}

function switchPanel(panel) {
  state.activePanel = panel;
  $$(".panel").forEach((element) => element.classList.remove("active"));
  $(`#${panel}Panel`).classList.add("active");
  $$(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.panel === panel);
  });
  if (panel === "dashboard") drawChart();
  if (panel === "leads") renderLeadInbox();
}

function uniqueCategories() {
  return [...new Set(state.products.map((product) => product.category).filter(Boolean))].sort();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function leadProducts(lead) {
  const ids = new Set(lead.matched_product_ids);
  const names = new Set(lead.matched_product_names.map((name) => name.toLowerCase()));
  return state.products.filter((product) => ids.has(product.id) || names.has(product.name.toLowerCase()));
}

function leadMessages(lead) {
  return state.leadMessages
    .filter((message) => message.customer_whatsapp === lead.customer_whatsapp)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function leadIntentScore(lead) {
  const text = `${lead.customer_message} ${lead.status}`.toLowerCase();
  let score = 42;
  if (/(buy|order|book|chahiye|chaiye|available|confirm|price|rate|cost)/i.test(text)) score += 28;
  if (leadProducts(lead).length || lead.matched_product_names.length) score += 18;
  if (lead.status === "new") score += 8;
  if (lead.status === "closed") score -= 30;
  return Math.max(0, Math.min(score, 100));
}

function customerInitial(phone) {
  return String(phone || "C").replace(/\D/g, "").slice(-1) || "C";
}

function maskPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length <= 4) return digits || "customer";
  return `${digits.slice(0, 2)}••••${digits.slice(-4)}`;
}

function statusLabel(status) {
  return String(status || "new")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

async function uploadProductImage(file) {
  if (!file || !file.size) return "";
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Unsupported image type");
  }
  const dataUrl = await readFileAsDataUrl(file);
  const response = await fetch("/api/product-images", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      dataUrl,
    }),
  });
  if (!response.ok) throw new Error("Image upload failed");
  const result = await response.json();
  return result.image_url || "";
}

function resetImagePreview() {
  const preview = $("#imagePreview");
  const image = $("#imagePreviewImg");
  if (image.dataset.previewUrl) {
    URL.revokeObjectURL(image.dataset.previewUrl);
  }
  image.removeAttribute("src");
  image.dataset.previewUrl = "";
  $("#imagePreviewName").textContent = "";
  preview.hidden = true;
}

function updateImagePreview(file) {
  resetImagePreview();
  if (!file || !file.size) return;
  const previewUrl = URL.createObjectURL(file);
  const image = $("#imagePreviewImg");
  image.src = previewUrl;
  image.dataset.previewUrl = previewUrl;
  $("#imagePreviewName").textContent = file.name;
  $("#imagePreview").hidden = false;
}

function openProductDialog(product = null) {
  const form = $("#productForm");
  const isEdit = Boolean(product);
  form.reset();
  resetImagePreview();
  form.elements.id.value = product?.id || "";
  form.elements.existing_image_url.value = product?.image_url || "";
  form.elements.name.value = product?.name || "";
  form.elements.description.value = product?.description || "";
  form.elements.category.value = product?.category || "";
  form.elements.price.value = product?.price || "";
  form.elements.stock.value = product?.stock || "";
  form.elements.sizes.value = product?.sizes?.join(", ") || "";
  form.elements.colors.value = product?.colors?.join(", ") || "";
  $("#productDialogTitle").textContent = isEdit ? "Edit product" : "Add product";
  $("#saveProductButton").textContent = isEdit ? "Save changes" : "Publish listing";
  $("#deleteProductButton").hidden = !isEdit;
  $("#pauseProductButton").hidden = !isEdit;
  $("#pauseProductButton").textContent = product?.status === "paused" ? "Resume" : "Pause";
  $("#productDialog").showModal();
}

function closeProductDialog() {
  const productDialog = $("#productDialog");
  $("#productForm").reset();
  resetImagePreview();
  $("#deleteProductButton").hidden = true;
  $("#pauseProductButton").hidden = true;
  if (productDialog.open) productDialog.close();
}

async function handleProductSubmit(event) {
  if (event.submitter?.value === "cancel") {
    resetImagePreview();
    return;
  }
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const imageFile = formData.get("image_file");
  const productId = formData.get("id");
  const existingImageUrl = formData.get("existing_image_url");
  const existingProduct = state.products.find((product) => product.id === productId);
  let imageUrl = "";

  try {
    imageUrl = await uploadProductImage(imageFile);
  } catch (error) {
    alert("Image upload nahi ho paayi. JPG, PNG ya WebP file select karo.");
    return;
  }

  const product = normalizeProduct({
    id: crypto.randomUUID(),
    name: formData.get("name"),
    description: formData.get("description"),
    category: formData.get("category"),
    price: formData.get("price"),
    stock: formData.get("stock"),
    sizes: splitList(formData.get("sizes")),
    colors: splitList(formData.get("colors")),
    image_url: imageUrl || existingImageUrl,
    status: existingProduct?.status || "active",
    inquiries: existingProduct?.inquiries ?? Math.floor(Math.random() * 12) + 3,
    orders: existingProduct?.orders ?? Math.floor(Math.random() * 4),
  });

  try {
    if (productId) {
      const updated = await updateSupabaseProduct({ ...product, id: productId });
      state.products = state.products.map((item) => (item.id === productId ? updated : item));
    } else {
      const inserted = await insertSupabaseProduct(product);
      state.products.unshift(inserted);
    }
    await fetchSupabaseProducts();
  } catch (error) {
    alert("Product save nahi hua. Supabase ya API issue check karo.");
    return;
  }

  closeProductDialog();
  renderAll();
  switchPanel("inventory");
}

async function handleDeleteProduct(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;
  const confirmed = confirm(`Delete ${product.name}? Ye product WhatsApp AI recommendations se bhi hat jayega.`);
  if (!confirmed) return;
  try {
    await deleteSupabaseProduct(productId);
    state.products = state.products.filter((item) => item.id !== productId);
    closeProductDialog();
    renderAll();
  } catch {
    alert("Product delete nahi hua. API ya Supabase issue check karo.");
  }
}

async function handlePauseProduct(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;
  const nextStatus = product.status === "paused" ? "active" : "paused";
  try {
    const updated = await updateSupabaseProduct({ ...product, status: nextStatus });
    state.products = state.products.map((item) => (item.id === productId ? updated : item));
    closeProductDialog();
    renderAll();
  } catch {
    alert("Product status update nahi hua.");
  }
}

function updateSyncButton(message) {
  const syncButton = $("#syncButton");
  syncButton.title = message;
  syncButton.setAttribute("aria-label", message);
  syncButton.classList.toggle("connected", hasSupabaseConfig());
}

function findMatches(query) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const budget = Number(query.match(/(?:under|below|less than|₹|rs\.?)\s*(\d+)/i)?.[1] || 0);
  return state.products
    .map((product) => {
      const text = [
        product.name,
        product.category,
        product.colors.join(" "),
        product.sizes.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      const keywordScore = terms.reduce((score, term) => score + (text.includes(term) ? 14 : 0), 0);
      const budgetScore = budget && product.price <= budget ? 18 : 0;
      const demandScore = Math.min(product.inquiries, 35);
      const stockScore = product.stock > 0 ? 10 : -30;
      return { product, score: keywordScore + budgetScore + demandScore + stockScore };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

function renderChat(query, matches) {
  $("#chatWindow").innerHTML = `
    <div class="message ai">Hi, bolo customer ko kya chahiye? Main live inventory se best pieces nikal dunga.</div>
    <div class="message user">${escapeHtml(query)}</div>
    <div class="message ai">Top ${matches.length} options mil gaye. Budget, color, size aur demand score ke basis pe rank kiya hai.</div>
  `;
}

function renderMatches(matches) {
  $("#matchResults").innerHTML = matches
    .map(
      ({ product, score }) => `
      <article class="match-card">
        <img src="${escapeHtml(product.image_url || "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=80")}" alt="${escapeHtml(product.name)}" />
        <div>
          <strong>${escapeHtml(product.name)}</strong>
          <small>${escapeHtml(product.category)} · ${currency.format(product.price)} · ${product.stock} stock</small>
          <p class="match-score">${Math.max(score, 0)} match score</p>
        </div>
      </article>
    `,
    )
    .join("");
}

function handleMatchSubmit(event) {
  event.preventDefault();
  const query = $("#matchQuery").value.trim() || "black party shirt under 1500 in L size";
  const matches = findMatches(query);
  renderChat(query, matches);
  renderMatches(matches);
}

function bindEvents() {
  $$(".nav-item").forEach((button) => {
    button.addEventListener("click", () => switchPanel(button.dataset.panel));
  });
  $$("[data-panel-shortcut]").forEach((button) => {
    button.addEventListener("click", () => switchPanel(button.dataset.panelShortcut));
  });
  $$("[data-open-listing]").forEach((button) => {
    button.addEventListener("click", () => openProductDialog());
  });
  $("#healthList").addEventListener("click", (event) => {
    if (event.target.closest("[data-open-listing]")) {
      openProductDialog();
    }
  });
  $("#productForm").addEventListener("submit", handleProductSubmit);
  $("#productDialog").addEventListener("close", () => {
    if (!$("#productDialog").returnValue) return;
    resetImagePreview();
  });
  $("#productImageInput").addEventListener("change", (event) => {
    updateImagePreview(event.currentTarget.files?.[0]);
  });
  $("#searchInput").addEventListener("input", () => {
    state.inventoryPage = 1;
    renderProducts();
  });
  $("#categoryFilter").addEventListener("change", () => {
    state.inventoryPage = 1;
    renderProducts();
  });
  $("#stockFilterButton").addEventListener("click", () => {
    state.lowStockOnly = !state.lowStockOnly;
    state.inventoryPage = 1;
    $("#stockFilterButton").classList.toggle("active", state.lowStockOnly);
    renderProducts();
  });
  $("#pageSizeSelect").addEventListener("change", (event) => {
    state.inventoryPageSize = Number(event.currentTarget.value);
    state.inventoryPage = 1;
    renderProducts();
  });
  $("#productPager").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const page = button.dataset.page ? Number(button.dataset.page) : state.inventoryPage + Number(button.dataset.pageStep || 0);
    if (!Number.isFinite(page)) return;
    state.inventoryPage = Math.max(1, page);
    renderProducts();
  });
  $("#productGrid").addEventListener("click", (event) => {
    const favoriteButton = event.target.closest(".favorite-button");
    if (favoriteButton) {
      favoriteButton.classList.toggle("active");
      favoriteButton.textContent = favoriteButton.classList.contains("active") ? "♥" : "♡";
      return;
    }
    const editButton = event.target.closest("[data-edit-product]");
    if (editButton) {
      const product = state.products.find((item) => item.id === editButton.dataset.editProduct);
      if (product) openProductDialog(product);
      return;
    }
    const deleteButton = event.target.closest("[data-delete-product]");
    if (deleteButton) {
      handleDeleteProduct(deleteButton.dataset.deleteProduct);
    }
  });
  $("#deleteProductButton").addEventListener("click", () => {
    const productId = $("#productForm").elements.id.value;
    if (productId) handleDeleteProduct(productId);
  });
  $("#pauseProductButton").addEventListener("click", () => {
    const productId = $("#productForm").elements.id.value;
    if (productId) handlePauseProduct(productId);
  });
  $("#leadSearchInput").addEventListener("input", renderLeadInbox);
  $("#leadStatusFilter").addEventListener("change", renderLeadInbox);
  $("#leadList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-lead-id]");
    if (!button) return;
    state.selectedLeadId = button.dataset.leadId;
    renderLeadInbox();
  });
  $("#hotLeadList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-lead-id]");
    if (!button) return;
    state.selectedLeadId = button.dataset.leadId;
    switchPanel("leads");
  });
  $("#rangeFilter").addEventListener("change", drawChart);
  $("#matchForm").addEventListener("submit", handleMatchSubmit);
  $("#syncButton").addEventListener("click", async () => {
    try {
      await fetchSupabaseProducts();
      await fetchLeads();
      updateSyncButton("Synced with Supabase");
      renderAll();
    } catch (error) {
      updateSyncButton("Sync failed");
    }
  });
  window.addEventListener("resize", drawChart);
}

function init() {
  loadLocalState();
  bindEvents();
  fetchDefaultShopId()
    .then(fetchSupabaseProducts)
    .then(fetchLeads)
    .catch(() => updateSyncButton("Supabase sync failed"))
    .finally(() => {
      renderAll();
      renderChat("black party shirt under 1500 in L size", findMatches("black party shirt under 1500 in L size"));
      renderMatches(findMatches("black party shirt under 1500 in L size"));
    });
}

init();
