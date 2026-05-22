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

const state = {
  products: [],
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

function normalizeProduct(product) {
  return {
    id: product.id || crypto.randomUUID(),
    name: product.name || "Untitled product",
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
  $("#todayLeads").textContent = `${leadSeries[7].at(-1)} leads`;
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
    return haystack.includes(query) && (category === "all" || product.category === category);
  });

  $("#productGrid").innerHTML = products.length
    ? products.map(renderProductCard).join("")
    : `<div class="empty-state">No products match this filter yet.</div>`;
}

function renderProductCard(product) {
  const image = product.image_url || "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=80";
  const tags = [...product.sizes, ...product.colors].slice(0, 6);
  return `
    <article class="product-card">
      <img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" loading="lazy" />
      <div class="product-content">
        <div class="product-title">
          <strong>${escapeHtml(product.name)}</strong>
          <span class="price">${currency.format(product.price)}</span>
        </div>
        <small>${escapeHtml(product.category)} · ${product.stock} in stock · ${product.inquiries} inquiries</small>
        <div class="tag-list">
          ${tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
        </div>
      </div>
    </article>
  `;
}

function renderCategoryBars() {
  const totals = uniqueCategories().map((category) => ({
    category,
    value: state.products
      .filter((product) => product.category === category)
      .reduce((sum, product) => sum + product.inquiries, 0),
  }));
  const max = Math.max(...totals.map((item) => item.value), 1);
  $("#categoryBars").innerHTML = totals
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)
    .map(
      (item) => `
      <div class="bar-row">
        <header>
          <strong>${escapeHtml(item.category)}</strong>
          <span>${item.value}</span>
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
    .slice(0, 5);
  $("#healthList").innerHTML = sorted
    .map((product) => {
      const needsRestock = product.stock <= 5;
      return `
      <div class="health-item">
        <div>
          <strong>${escapeHtml(product.name)}</strong>
          <span>${escapeHtml(product.category)} · ${product.stock} stock · ${product.orders} orders</span>
        </div>
        <span class="status-chip ${needsRestock ? "warning" : ""}">
          ${needsRestock ? "Restock" : "Healthy"}
        </span>
      </div>
    `;
    })
    .join("");
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

async function handleProductSubmit(event) {
  if (event.submitter?.value === "cancel") {
    resetImagePreview();
    return;
  }
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const imageFile = formData.get("image_file");
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
    category: formData.get("category"),
    price: formData.get("price"),
    stock: formData.get("stock"),
    sizes: splitList(formData.get("sizes")),
    colors: splitList(formData.get("colors")),
    image_url: imageUrl,
    status: "active",
    inquiries: Math.floor(Math.random() * 12) + 3,
    orders: Math.floor(Math.random() * 4),
  });

  try {
    const inserted = await insertSupabaseProduct(product);
    state.products.unshift(inserted);
    await fetchSupabaseProducts();
  } catch (error) {
    alert("Supabase config, shop setup, ya policy issue hai. Listing publish nahi hui.");
    return;
  }

  form.reset();
  resetImagePreview();
  $("#productDialog").close();
  renderAll();
  switchPanel("inventory");
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
  $$("[data-open-listing]").forEach((button) => {
    button.addEventListener("click", () => $("#productDialog").showModal());
  });
  $("#productForm").addEventListener("submit", handleProductSubmit);
  $("#productDialog").addEventListener("close", () => {
    if (!$("#productDialog").returnValue) return;
    resetImagePreview();
  });
  $("#productImageInput").addEventListener("change", (event) => {
    updateImagePreview(event.currentTarget.files?.[0]);
  });
  $("#searchInput").addEventListener("input", renderProducts);
  $("#categoryFilter").addEventListener("change", renderProducts);
  $("#rangeFilter").addEventListener("change", drawChart);
  $("#matchForm").addEventListener("submit", handleMatchSubmit);
  $("#syncButton").addEventListener("click", async () => {
    try {
      await fetchSupabaseProducts();
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
    .catch(() => updateSyncButton("Supabase sync failed"))
    .finally(() => {
      renderAll();
      renderChat("black party shirt under 1500 in L size", findMatches("black party shirt under 1500 in L size"));
      renderMatches(findMatches("black party shirt under 1500 in L size"));
    });
}

init();
